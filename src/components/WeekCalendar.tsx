import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DayKey, WeekMenu } from '../types';
import { DAY_KEYS, getDayLabel, getWeekDates } from '../utils/weekUtils';

interface Props {
  weekKey: string;
  weekMenu: WeekMenu | null;
  onDayPress: (day: DayKey) => void;
}

export default function WeekCalendar({ weekKey, weekMenu, onDayPress }: Props) {
  const dates = getWeekDates(weekKey);

  return (
    <View style={styles.container}>
      {DAY_KEYS.map((dayKey, i) => {
        const date = dates[i];
        const entry = weekMenu?.days[dayKey];
        const isWeekend = dayKey === 'Sat' || dayKey === 'Sun';

        return (
          <TouchableOpacity
            key={dayKey}
            style={styles.dayCell}
            onPress={() => onDayPress(dayKey)}
            activeOpacity={0.7}
          >
            <View style={styles.dayHeader}>
              <Text style={[styles.dayLabelText, isWeekend && styles.weekend]}>
                {getDayLabel(dayKey)}
              </Text>
              <Text style={[styles.dateText, isWeekend && styles.weekend]}>
                {date.getMonth() + 1}/{date.getDate()}
              </Text>
            </View>

            <View style={[styles.entryArea, entry && styles.entryFilled]}>
              {entry ? (
                <>
                  <Text style={styles.dishName} numberOfLines={2}>
                    {entry.dishName || entry.note || '入力済み'}
                  </Text>
                  {entry.note && entry.dishName ? (
                    <Text style={styles.noteText} numberOfLines={1}>
                      {entry.note}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.emptyText}>タップして入力</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 16,
  },
  dayCell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayHeader: {
    width: 52,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
  },
  dayLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  dateText: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  weekend: {
    color: '#E8692A',
  },
  entryArea: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 60,
    justifyContent: 'center',
  },
  entryFilled: {
    backgroundColor: '#FFF8F5',
  },
  dishName: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
  },
  emptyText: {
    fontSize: 13,
    color: '#BBBBBB',
  },
});
