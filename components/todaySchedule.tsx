import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface ScheduleItem {
    id: string;
    time: string;
    timeRemaining: string;
    title: string;
    color: string;
}

const TodaySchedule = () => {
    // TODO DEBUG Get from firebase
    // Set items by time in seconds and work out by using multiples?
    const scheduleItems: ScheduleItem[] = [
        {
            id: '1',
            time: '12:30',
            timeRemaining: '(5 mins)',
            title: 'Take 2 cyclophosphamide tablets',
            color: theme.colours.primary,
        },
        {
            id: '2',
            time: '13:25',
            timeRemaining: '(1 hour)',
            title: 'Appointment at Oncology Ward',
            color: theme.colours.blue50,
        },
        {
            id: '3',
            time: '12:30',
            timeRemaining: '(5 mins)',
            title: 'Take 2 cyclophosphamide tablets',
            color: theme.colours.primary,
        },
        {
            id: '4',
            time: '13:25',
            timeRemaining: '(1 hour)',
            title: 'Appointment at Oncology Ward',
            color: theme.colours.blue50,
        },
        {
            id: '5',
            time: '12:30',
            timeRemaining: '(5 mins)',
            title: 'Take 2 cyclophosphamide tablets',
            color: theme.colours.primary,
        },
        {
            id: '6',
            time: '13:25',
            timeRemaining: '(1 hour)',
            title: 'Appointment at Oncology Ward',
            color: theme.colours.blue50,
        },
        {
            id: '7',
            time: '18:30',
            timeRemaining: '(6 hours)',
            title: 'Take 2 cyclophosphamide tablets',
            color: theme.colours.blue80
        }
    ];
    if (scheduleItems.length == 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Nothing scheduled for today</Text>
            </View>
        );
    } else {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Todays schedule</Text>
    
                {scheduleItems.slice(0,3).map(item => (
                    <View key={item.id} style={styles.scheduleItem}>
                        <View style={styles.timeContainer}>
                            <View style={[styles.timeMarker, { backgroundColor: item.color }]} />
                            <View>
                                <Text style={styles.time}>{item.time}</Text>
                                <Text style={styles.timeRemaining}>{item.timeRemaining}</Text>
                            </View>
                        </View>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    scheduleItem: {
        flexDirection: 'row',
        marginBottom: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        width: 100,
    },
    timeMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
    },
    time: {
        fontWeight: 'bold',
    },
    timeRemaining: {
        fontSize: 12,
        color: '#666',
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderLeftWidth: 1,
        borderLeftColor: '#eee',
    },
    itemTitle: {
        fontSize: 15,
    }
});

export default TodaySchedule;