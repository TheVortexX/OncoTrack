import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import moment from 'moment';
import Header from '@/components/header';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

interface SymptomLog {
    id: string;
    date: string;
    symptoms: {
        [category: string]: string;
    };
    notes?: string;
}

interface ChartData {
    value: number;
    label: string;
    frontColor?: string;
}

const SymptomReportScreen = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [startDate, setStartDate] = useState(moment().subtract(7, 'days').toDate());
    const [endDate, setEndDate] = useState(moment().toDate());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
    const [hasGeneratedReport, setHasGeneratedReport] = useState(false);

    const [moodData, setMoodData] = useState<ChartData[]>([]);
    const [energyData, setEnergyData] = useState<ChartData[]>([]);
    const [painData, setPainData] = useState<ChartData[]>([]);
    const [lineChartData, setLineChartData] = useState<any[]>([]);

    const handleDateChange = (event: any, selectedDate: Date | undefined, dateType: 'start' | 'end') => {
        if (Platform.OS === 'android') {
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
        }

        if (!selectedDate) return;

        if (dateType === 'start') {
            if (moment(selectedDate).isAfter(endDate)) {
                Alert.alert('Invalid Date Range', 'Start date cannot be after end date');
                return;
            }
            setStartDate(selectedDate);
        } else {
            if (moment(selectedDate).isBefore(startDate)) {
                Alert.alert('Invalid Date Range', 'End date cannot be before start date');
                return;
            }
            setEndDate(selectedDate);
        }
    };

    const formatDateForDisplay = (date: Date) => {
        return moment(date).format('MMM DD, YYYY');
    };

    const generateReport = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        setIsLoading(true);
        setHasGeneratedReport(true);

        try {
            const startDateStr = moment(startDate).format('YYYY-MM-DD');
            const endDateStr = moment(endDate).format('YYYY-MM-DD');

            const symptomsRef = collection(firestore, 'users', user.uid, 'symptomLogs');
            const q = query(
                symptomsRef,
                where('date', '>=', startDateStr),
                where('date', '<=', endDateStr),
                orderBy('date', 'asc')
            );

            const querySnapshot = await getDocs(q);
            const logs: SymptomLog[] = [];

            querySnapshot.forEach((doc) => {
                logs.push({
                    id: doc.id,
                    ...doc.data(),
                } as SymptomLog);
            });

            setSymptomLogs(logs);

            processChartData(logs);
        } catch (error) {
            console.error('Error fetching symptom logs:', error);
            Alert.alert('Error', 'Failed to fetch symptom data');
        } finally {
            setIsLoading(false);
        }
    };

    // Process the symptom logs into chart data
    const processChartData = (logs: SymptomLog[]) => {
        const moodCounts: Record<string, number> = {};
        const energyCounts: Record<string, number> = {};
        const painCounts: Record<string, number> = {};

        logs.forEach(log => {
            if (log.symptoms.mood) {
                moodCounts[log.symptoms.mood] = (moodCounts[log.symptoms.mood] || 0) + 1;
            }

            if (log.symptoms.energy) {
                energyCounts[log.symptoms.energy] = (energyCounts[log.symptoms.energy] || 0) + 1;
            }

            if (log.symptoms.pain) {
                painCounts[log.symptoms.pain] = (painCounts[log.symptoms.pain] || 0) + 1;
            }
        });

        const moodChartData: ChartData[] = Object.entries(moodCounts).map(([mood, count]) => {
            const color = getMoodColor(mood);
            return {
                value: count,
                label: formatLabel(mood),
                frontColor: color,
            };
        });

        const energyChartData: ChartData[] = Object.entries(energyCounts).map(([energy, count]) => {
            const color = getEnergyColor(energy);
            return {
                value: count,
                label: formatLabel(energy),
                frontColor: color,
            };
        });

        const painChartData: ChartData[] = Object.entries(painCounts).map(([pain, count]) => {
            const color = getPainColor(pain);
            return {
                value: count,
                label: formatLabel(pain),
                frontColor: color,
            };
        });

        const tempData = logs
            .filter(log => log.symptoms.temperature)
            .map(log => ({
                date: log.date,
                value: parseFloat(log.symptoms.temperature),
                label: moment(log.date).format('MMM DD'),
                dataPointText: log.symptoms.temperature,
            }))
            .sort((a, b) => moment(a.date).diff(moment(b.date)));

        setMoodData(moodChartData);
        setEnergyData(energyChartData);
        setPainData(painChartData);
        setLineChartData(tempData);
    };

    const formatLabel = (label: string): string => {
        return label
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getMoodColor = (mood: string): string => {
        const colors: Record<string, string> = {
            excellent: '#4CAF50',
            happy: '#8BC34A',
            average: '#FFEB3B',
            blank: '#9E9E9E',
            'fed-up': '#FF9800',
            sad: '#FF5722',
            upset: '#F44336',
            angry: '#D32F2F',
        };
        return colors[mood] || theme.colours.primary;
    };

    const getEnergyColor = (energy: string): string => {
        const colors: Record<string, string> = {
            exhausted: '#F44336',
            tired: '#FF9800',
            ok: '#FFEB3B',
            energetic: '#4CAF50',
        };
        return colors[energy] || theme.colours.primary;
    };

    const getPainColor = (pain: string): string => {
        const colors: Record<string, string> = {
            'pain-free': '#4CAF50',
            headache: '#F44336',
            stomach: '#FF9800',
            joint: '#9C27B0',
        };
        return colors[pain] || theme.colours.blue20;
    };

    return (
        <View style={styles.container}>
            <Header
                title="Symptom Report"
                subtitle="Analyze your symptoms over time"
                leftButtonType="back"
            />

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={[
                    styles.scrollContentContainer,
                    { paddingBottom: symptomLogs.length > 0 ? 100 : 20 }
                ]}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Date Range</Text>

                    {/* Start date selector */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={styles.dateLabel}>
                                <MaterialCommunityIcons
                                    name="calendar-start"
                                    size={24}
                                    color={theme.colours.primary}
                                    style={styles.dateIcon}
                                />
                                <Text style={styles.settingLabel}>Start Date</Text>
                            </View>
                            <Text style={styles.settingValue}>{formatDateForDisplay(startDate)}</Text>
                        </View>

                        {Platform.OS === 'ios' ? (
                            <View style={styles.datePickerContainer}>
                                <DateTimePicker
                                    value={startDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => handleDateChange(event, date, 'start')}
                                    style={styles.iosDatePicker}
                                    textColor={theme.colours.textPrimary}
                                    themeVariant="light"
                                    maximumDate={new Date()}
                                />
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => setShowStartDatePicker(true)}
                                    style={styles.actionButton}
                                >
                                    <Text style={styles.actionButtonText}>Change</Text>
                                </TouchableOpacity>

                                {showStartDatePicker && (
                                    <DateTimePicker
                                        value={startDate}
                                        mode="date"
                                        display="default"
                                        onChange={(event, date) => handleDateChange(event, date, 'start')}
                                        maximumDate={new Date()}
                                    />
                                )}
                            </>
                        )}
                    </View>

                    {/* End date selector */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={styles.dateLabel}>
                                <MaterialCommunityIcons
                                    name="calendar-end"
                                    size={24}
                                    color={theme.colours.primary}
                                    style={styles.dateIcon}
                                />
                                <Text style={styles.settingLabel}>End Date</Text>
                            </View>
                            <Text style={styles.settingValue}>{formatDateForDisplay(endDate)}</Text>
                        </View>

                        {Platform.OS === 'ios' ? (
                            <View style={styles.datePickerContainer}>
                                <DateTimePicker
                                    value={endDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => handleDateChange(event, date, 'end')}
                                    style={styles.iosDatePicker}
                                    textColor={theme.colours.textPrimary}
                                    themeVariant="light"
                                    maximumDate={new Date()}
                                />
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => setShowEndDatePicker(true)}
                                    style={styles.actionButton}
                                >
                                    <Text style={styles.actionButtonText}>Change</Text>
                                </TouchableOpacity>

                                {showEndDatePicker && (
                                    <DateTimePicker
                                        value={endDate}
                                        mode="date"
                                        display="default"
                                        onChange={(event, date) => handleDateChange(event, date, 'end')}
                                        maximumDate={new Date()}
                                    />
                                )}
                            </>
                        )}
                    </View>
                </View>

                {/* Generate report button */}
                <TouchableOpacity
                    style={styles.generateButton}
                    onPress={generateReport}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.colours.white} />
                    ) : (
                        <Text style={styles.generateButtonText}>Generate Report</Text>
                    )}
                </TouchableOpacity>

                {/* Report content */}
                {hasGeneratedReport && !isLoading && (
                    <>
                        {symptomLogs.length === 0 ? (
                            <View style={styles.noDataContainer}>
                                <MaterialCommunityIcons
                                    name="chart-bar-stacked"
                                    size={50}
                                    color={theme.colours.gray}
                                />
                                <Text style={styles.noDataText}>
                                    No symptom data found for the selected date range
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.reportSummary}>
                                    <Text style={styles.reportSummaryText}>
                                        Report for {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
                                    </Text>
                                    <Text style={styles.reportDataCount}>
                                        {symptomLogs.length} days of data
                                    </Text>
                                </View>

                                {/* Mood chart section */}
                                {moodData.length > 0 && (
                                    <View style={styles.chartSection}>
                                        <Text style={styles.chartTitle}>Mood Distribution</Text>
                                        <View style={styles.chartContainer}>
                                            <PieChart
                                                data={moodData}
                                                donut
                                                showGradient
                                                sectionAutoFocus
                                                radius={90}
                                                innerRadius={60}
                                                innerCircleColor={theme.colours.background}
                                                centerLabelComponent={() => (
                                                    <Text style={styles.centerLabel}>Mood</Text>
                                                )}
                                            />
                                        </View>
                                        <View style={styles.legendContainer}>
                                            {moodData.map((item, index) => (
                                                <View key={index} style={styles.legendItem}>
                                                    <View
                                                        style={[
                                                            styles.legendColor,
                                                            { backgroundColor: item.frontColor }
                                                        ]}
                                                    />
                                                    <Text style={styles.legendText}>
                                                        {item.label}: {item.value} day{item.value !== 1 ? 's' : ''}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Energy chart section */}
                                {energyData.length > 0 && (
                                    <View style={styles.chartSection}>
                                        <Text style={styles.chartTitle}>Energy Levels</Text>
                                        <View style={styles.chartContainer}>
                                            <PieChart
                                                data={energyData}
                                                donut
                                                showGradient
                                                sectionAutoFocus
                                                radius={90}
                                                innerRadius={60}
                                                innerCircleColor={theme.colours.background}
                                                centerLabelComponent={() => (
                                                    <Text style={styles.centerLabel}>Energy</Text>
                                                )}
                                            />
                                        </View>
                                        <View style={styles.legendContainer}>
                                            {energyData.map((item, index) => (
                                                <View key={index} style={styles.legendItem}>
                                                    <View
                                                        style={[
                                                            styles.legendColor,
                                                            { backgroundColor: item.frontColor }
                                                        ]}
                                                    />
                                                    <Text style={styles.legendText}>
                                                        {item.label}: {item.value} day{item.value !== 1 ? 's' : ''}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Pain chart section */}
                                {painData.length > 0 && (
                                    <View style={styles.chartSection}>
                                        <Text style={styles.chartTitle}>Pain Types</Text>
                                        <View style={styles.chartContainer}>
                                            <PieChart
                                                data={painData}
                                                donut
                                                showGradient
                                                sectionAutoFocus
                                                radius={90}
                                                innerRadius={60}
                                                innerCircleColor={theme.colours.background}
                                                centerLabelComponent={() => (
                                                    <Text style={styles.centerLabel}>Pain</Text>
                                                )}
                                            />
                                        </View>
                                        <View style={styles.legendContainer}>
                                            {painData.map((item, index) => (
                                                <View key={index} style={styles.legendItem}>
                                                    <View
                                                        style={[
                                                            styles.legendColor,
                                                            { backgroundColor: item.frontColor }
                                                        ]}
                                                    />
                                                    <Text style={styles.legendText}>
                                                        {item.label}: {item.value} day{item.value !== 1 ? 's' : ''}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Temperature chart section */}
                                {lineChartData.length > 0 && (
                                    <View style={styles.chartSection}>
                                        <Text style={styles.chartTitle}>Temperature Over Time</Text>
                                        <View style={[styles.chartContainer, { paddingHorizontal: 0 }]}>
                                            <LineChart
                                                data={lineChartData}
                                                width={Platform.OS === 'ios' ? 370 : 330}
                                                height={220}
                                                spacing={45}
                                                color={theme.colours.blue20}
                                                thickness={3}
                                                hideRules
                                                xAxisLabelTextStyle={styles.chartAxisText}
                                                yAxisTextStyle={styles.chartAxisText}
                                                showFractionalValues
                                                showDataPointLabelOnFocus
                                                dataPointsHeight={20}
                                                dataPointsWidth={20}
                                                dataPointsColor={theme.colours.primary}
                                                dataPointsRadius={4}
                                                noOfSections={5}
                                                areaChart
                                                startFillColor={theme.colours.blue20}
                                                endFillColor={theme.colours.background}
                                                startOpacity={0.8}
                                                endOpacity={0.1}
                                                rulesColor={theme.colours.border}
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Symptom Frequency Bar Chart */}
                                <View style={styles.chartSection}>
                                    <Text style={styles.chartTitle}>Symptom Frequency</Text>
                                    <View style={styles.chartContainer}>
                                        <BarChart
                                            width={320}
                                            height={200}
                                            barWidth={32}
                                            spacing={25}
                                            noOfSections={4}
                                            barBorderRadius={4}
                                            frontColor={theme.colours.primary}
                                            data={[
                                                { value: moodData.length, label: 'Mood', frontColor: theme.colours.primary },
                                                { value: energyData.length, label: 'Energy', frontColor: theme.colours.success },
                                                { value: painData.length, label: 'Pain', frontColor: theme.colours.blue20 },
                                                { value: lineChartData.length, label: 'Temp', frontColor: theme.colours.danger }
                                            ]}
                                            yAxisTextStyle={styles.chartAxisText}
                                            xAxisLabelTextStyle={styles.chartAxisText}
                                            hideRules
                                            showYAxisIndices={false}
                                        />
                                    </View>
                                </View>

                                {/* Share/Export Button */}
                                <TouchableOpacity style={styles.shareButton}>
                                    <FontAwesome5 name="share-alt" size={16} color={theme.colours.white} style={styles.shareIcon} />
                                    <Text style={styles.shareButtonText}>Share Report</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.background,
        marginBottom: 70,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 16,
    },
    section: {
        marginVertical: 12,
        backgroundColor: theme.colours.surface,
        borderRadius: 12,
        shadowColor: theme.colours.blue0,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.textPrimary,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.border,
    },
    settingInfo: {
        flex: 1,
    },
    dateLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        marginRight: 8,
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.textPrimary,
    },
    settingValue: {
        fontSize: 14,
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textSecondary,
        marginTop: 4,
        marginLeft: 32,
    },
    datePickerContainer: {
        width: 120,
    },
    iosDatePicker: {
        width: 120,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colours.primary,
    },
    actionButtonText: {
        fontSize: 14,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.white,
    },
    generateButton: {
        marginHorizontal: 0,
        marginVertical: 20,
        backgroundColor: theme.colours.buttonBlue,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    generateButtonText: {
        fontSize: 16,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.white,
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: theme.colours.surface,
        borderRadius: 10,
        marginTop: 20,
    },
    noDataText: {
        fontSize: 16,
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textSecondary,
        textAlign: 'center',
        marginTop: 10,
    },
    reportSummary: {
        backgroundColor: theme.colours.blue80,
        borderRadius: 10,
        padding: 16,
        marginTop: 10,
        marginBottom: 20,
    },
    reportSummaryText: {
        fontSize: 16,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.white,
    },
    reportDataCount: {
        fontSize: 14,
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.white,
        marginTop: 4,
    },
    chartSection: {
        backgroundColor: theme.colours.surface,
        borderRadius: 10,
        marginBottom: 20,
        padding: 16,
        shadowColor: theme.colours.blue0,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chartTitle: {
        fontSize: 18,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.textPrimary,
        marginBottom: 16,
    },
    chartContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    centerLabel: {
        fontSize: 16,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.textPrimary,
    },
    legendContainer: {
        marginTop: 20,
        paddingHorizontal: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textSecondary,
    },
    chartAxisText: {
        fontSize: 10,
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textSecondary,
    },
    shareButton: {
        flexDirection: 'row',
        backgroundColor: theme.colours.blue20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    shareIcon: {
        marginRight: 8,
    },
    shareButtonText: {
        fontSize: 16,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.white,
    },
});

export default SymptomReportScreen;