import React, { useState } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import moment from 'moment';
import Header from '@/components/header';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

const MOOD_COLORS = {
    excellent: '#4CAF50',
    happy: '#8BC34A',
    average: '#FFEB3B',
    blank: '#9E9E9E',
    'fed-up': '#FF9800',
    sad: '#FF5722',
    upset: '#F44336',
    angry: '#D32F2F',
};

const ENERGY_COLORS = {
    exhausted: '#F44336',
    tired: '#FF9800',
    ok: '#FFEB3B',
    energetic: '#4CAF50',
};

const PAIN_COLORS = {
    'pain-free': '#4CAF50',
    headache: '#F44336',
    stomach: '#FF9800',
    joint: '#9C27B0',
};

// Mood value mapping for line chart
const MOOD_VALUES = {
    excellent: 3,
    happy: 2,
    average: 1,
    blank: 0,
    'fed-up': -1,
    sad: -2,
    upset: -3,
    angry: -4,
};

// Energy value mapping for line chart
const ENERGY_VALUES = {
    exhausted: 0,
    tired: 1,
    ok: 2,
    energetic: 3,
};

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
    color?: string;
}

const SymptomReportScreen = () => {
    const { user } = useAuth();

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
    const [temperatureData, setTemperatureData] = useState<any[]>([]);
    const [moodLineData, setMoodLineData] = useState<any[]>([]);
    const [energyLineData, setEnergyLineData] = useState<any[]>([]);

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
        const moodTimelineData: any[] = [];
        const energyTimelineData: any[] = [];
        const tempData: any[] = [];

        // Sort logs by date to ensure chronological order
        const sortedLogs = [...logs].sort((a, b) =>
            moment(a.date).valueOf() - moment(b.date).valueOf()
        );

        sortedLogs.forEach(log => {
            const formattedDate = moment(log.date).format('MMM DD');

            // Process mood data
            if (log.symptoms.mood) {
                // For pie chart - count occurrences
                moodCounts[log.symptoms.mood] = (moodCounts[log.symptoms.mood] || 0) + 1;

                // For line chart - map to numeric value
                if (MOOD_VALUES[log.symptoms.mood as keyof typeof MOOD_VALUES] !== undefined) {
                    moodTimelineData.push({
                        date: log.date,
                        value: MOOD_VALUES[log.symptoms.mood as keyof typeof MOOD_VALUES],
                        label: formattedDate,
                        dataPointText: formatLabel(log.symptoms.mood),
                        color: MOOD_COLORS[log.symptoms.mood as keyof typeof MOOD_COLORS] || theme.colours.primary
                    });
                }
            }

            // Process energy data
            if (log.symptoms.energy) {
                // For pie chart
                energyCounts[log.symptoms.energy] = (energyCounts[log.symptoms.energy] || 0) + 1;

                // For line chart
                if (ENERGY_VALUES[log.symptoms.energy as keyof typeof ENERGY_VALUES] !== undefined) {
                    energyTimelineData.push({
                        date: log.date,
                        value: ENERGY_VALUES[log.symptoms.energy as keyof typeof ENERGY_VALUES],
                        label: formattedDate,
                        dataPointText: formatLabel(log.symptoms.energy),
                        color: ENERGY_COLORS[log.symptoms.energy as keyof typeof ENERGY_COLORS] || theme.colours.primary
                    });
                }
            }

            // Process pain data
            if (log.symptoms.pain) {
                painCounts[log.symptoms.pain] = (painCounts[log.symptoms.pain] || 0) + 1;
            }

            // Process temperature data
            if (log.symptoms.temperature) {
                tempData.push({
                    date: log.date,
                    value: parseFloat(log.symptoms.temperature),
                    label: formattedDate,
                    dataPointText: log.symptoms.temperature,
                });
            }
        });

        // Create pie chart data
        const moodChartData: ChartData[] = Object.entries(moodCounts).map(([mood, count]) => {
            return {
                value: count,
                label: formatLabel(mood),
                color: MOOD_COLORS[mood as keyof typeof MOOD_COLORS] || theme.colours.primary,
            };
        });

        const energyChartData: ChartData[] = Object.entries(energyCounts).map(([energy, count]) => {
            return {
                value: count,
                label: formatLabel(energy),
                color: ENERGY_COLORS[energy as keyof typeof ENERGY_COLORS] || theme.colours.primary,
            };
        });

        const painChartData: ChartData[] = Object.entries(painCounts).map(([pain, count]) => {
            return {
                value: count,
                label: formatLabel(pain),
                color: PAIN_COLORS[pain as keyof typeof PAIN_COLORS] || theme.colours.blue20,
            };
        });

        // Sort temperature and timeline data chronologically
        const sortedTempData = tempData.sort((a, b) => moment(a.date).diff(moment(b.date)));

        // Set state with processed data
        setMoodData(moodChartData);
        setEnergyData(energyChartData);
        setPainData(painChartData);
        setTemperatureData(sortedTempData);
        setMoodLineData(moodTimelineData);
        setEnergyLineData(energyTimelineData);
    };

    const formatLabel = (label: string): string => {
        return label
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
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

                                {/* Mood Distribution Pie Chart */}
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
                                                            { backgroundColor: item.color }
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

                                {/* Mood Line Chart */}
                                {moodLineData.length > 0 && (
                                    <View style={styles.chartSection}>
                                        <Text style={styles.chartTitle}>Mood Over Time</Text>
                                        <View style={[styles.chartContainer, { paddingHorizontal: 0 }]}>
                                            <LineChart
                                                data={moodLineData}
                                                width={Platform.OS === 'ios' ? 370 : 330}
                                                height={220}
                                                spacing={45}
                                                thickness={3}
                                                hideRules
                                                xAxisLabelTextStyle={styles.chartAxisText}
                                                yAxisTextStyle={styles.chartAxisText}
                                                hideDataPoints
                                                yAxisLabelTexts={[' ', 'Angry', 'Upset', 'Sad', 'Fed up', 'Blank', 'Average', 'Happy', 'Excellent', " "]}
                                                yAxisLabelWidth={50}
                                                dataPointsHeight={20}
                                                dataPointsWidth={20}
                                                dataPointsRadius={4}
                                                showDataPointLabelOnFocus
                                                noOfSections={4}
                                                maxValue={4}
                                                initialSpacing={20}
                                                endSpacing={30}
                                                color={theme.colours.primary}
                                                dataPointsColor={theme.colours.primary}
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Energy Distribution Pie Chart */}
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
                                                            { backgroundColor: item.color }
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

                                {/* Energy Line Chart */}
                                {energyLineData.length > 0 && (
                                    <View style={styles.chartSection}>
                                        <Text style={styles.chartTitle}>Energy Over Time</Text>
                                        <View style={[styles.chartContainer, { paddingHorizontal: 0 }]}>
                                            <LineChart
                                                data={energyLineData}
                                                width={Platform.OS === 'ios' ? 370 : 330}
                                                height={220}
                                                spacing={45}
                                                thickness={3}
                                                hideRules
                                                xAxisLabelTextStyle={styles.chartAxisText}
                                                yAxisTextStyle={styles.chartAxisText}
                                                showFractionalValues
                                                dataPointsHeight={20}
                                                dataPointsWidth={20}
                                                dataPointLabelComponent={() => (null)}
                                                dataPointsRadius={4}
                                                showDataPointLabelOnFocus
                                                noOfSections={3}
                                                yAxisLabelTexts={['Exhausted', 'Tired', 'Ok', 'Energetic']}
                                                yAxisLabelWidth={60}
                                                maxValue={3}
                                                initialSpacing={20}
                                                endSpacing={30}
                                                color={theme.colours.success}
                                            />
                                        </View>
                                        <View style={styles.energyLegendContainer}>
                                            <Text style={styles.legendTitle}>Energy Values:</Text>
                                            <View style={styles.compactLegend}>
                                                {Object.entries(ENERGY_VALUES).map(([energy, value], index) => (
                                                    <View key={index} style={styles.energyLegendItem}>
                                                        <View
                                                            style={[
                                                                styles.legendColor,
                                                                { backgroundColor: ENERGY_COLORS[energy as keyof typeof ENERGY_COLORS] }
                                                            ]}
                                                        />
                                                        <Text style={styles.legendText}>
                                                            {formatLabel(energy)}: {value}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
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
                                                            { backgroundColor: item.color }
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

                                {/* Temperature chart section - with fixed min/max values */}
                                {temperatureData.length > 0 && (
                                    <View style={styles.chartSection}>
                                        <Text style={styles.chartTitle}>Temperature Over Time</Text>
                                        <View style={[styles.chartContainer, { paddingHorizontal: 0 }]}>
                                            <LineChart
                                                data={temperatureData}
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
                                                noOfSections={6}
                                                maxValue={45}
                                                initialSpacing={20}
                                                endSpacing={30}
                                                textShiftX={10}
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
                                                { value: moodData.length, label: 'Mood', frontColor: MOOD_COLORS.average },
                                                { value: energyData.length, label: 'Energy', frontColor: ENERGY_COLORS.ok },
                                                { value: painData.length, label: 'Pain', frontColor: PAIN_COLORS.headache },
                                                { value: temperatureData.length, label: 'Temp', frontColor: theme.colours.blue20 }
                                            ]}
                                            yAxisTextStyle={styles.chartAxisText}
                                            xAxisLabelTextStyle={styles.chartAxisText}
                                            hideRules
                                            showYAxisIndices={false}
                                        />
                                    </View>
                                </View>

                                {/* Share/Export Button
                                <TouchableOpacity style={styles.shareButton}>
                                    <FontAwesome5 name="share-alt" size={16} color={theme.colours.white} style={styles.shareIcon} />
                                    <Text style={styles.shareButtonText}>Share Report</Text>
                                </TouchableOpacity> */}
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
        fontSize: normaliseSize(18),
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
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.textPrimary,
    },
    settingValue: {
        fontSize: normaliseSize(14),
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
        fontSize: normaliseSize(14),
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
        fontSize: normaliseSize(16),
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
        fontSize: normaliseSize(16),
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
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.white,
    },
    reportDataCount: {
        fontSize: normaliseSize(14),
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
        fontSize: normaliseSize(18),
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.textPrimary,
        marginBottom: 16,
    },
    chartContainer: {
        alignItems: 'center',
        paddingVertical: 10,
        overflow: 'hidden',
    },
    centerLabel: {
        fontSize: normaliseSize(16),
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
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textSecondary,
    },
    chartAxisText: {
        fontSize: normaliseSize(10),
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
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.white,
    },
    moodLegendContainer: {
        marginTop: 15,
        paddingHorizontal: 10,
    },
    energyLegendContainer: {
        marginTop: 15,
        paddingHorizontal: 10,
    },
    legendTitle: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.textPrimary,
        marginBottom: 8,
    },
    compactLegend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    moodLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        width: '48%',
    },
    energyLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        width: '48%',
    },
    tempInfoContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: theme.colours.background,
        borderRadius: 8,
        alignItems: 'center',
    },
    tempInfoText: {
        fontSize: normaliseSize(12),
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textSecondary,
    },
    insightsSection: {
        backgroundColor: theme.colours.blue80,
        borderRadius: 10,
        marginBottom: 20,
        padding: 16,
        shadowColor: theme.colours.blue0,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    insightsContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    insightIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    insightText: {
        flex: 1,
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.white,
        lineHeight: 20,
    }
});

export default SymptomReportScreen;