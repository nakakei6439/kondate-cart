import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { DayKey, WeekMenu } from '../types';
import { DAY_KEYS, getDayLabel, getWeekDates } from '../utils/weekUtils';

interface Props {
  weekKey: string;
  weekMenu: WeekMenu | null;
  onDayPress: (day: DayKey) => void;
  onDayDelete?: (day: DayKey) => void;
  onDishAdd?: (day: DayKey) => void;
}

export default function WeekCalendar({ weekKey, weekMenu, onDayPress, onDayDelete, onDishAdd }: Props) {
  const dates = getWeekDates(weekKey);
  const swipeRefs = useRef<Map<DayKey, Swipeable | null>>(new Map());

  function renderRightActions(
    progress: Animated.AnimatedInterpolation<number>,
    dayKey: DayKey
  ) {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            swipeRefs.current.get(dayKey)?.close();
            onDayDelete?.(dayKey);
          }}
        >
          <Text style={styles.deleteBtnText}>削除</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      {DAY_KEYS.map((dayKey, i) => {
        const date = dates[i];
        const entry = weekMenu?.days[dayKey];
        const isWeekend = dayKey === 'Sat' || dayKey === 'Sun';

        return (
          <Swipeable
            key={dayKey}
            ref={(ref) => { swipeRefs.current.set(dayKey, ref); }}
            renderRightActions={(progress) => renderRightActions(progress, dayKey)}
            enabled={!!entry && !!onDayDelete}
            friction={2}
            overshootRight={false}
          >
          <View style={styles.dayCell}>
            <TouchableOpacity
              style={styles.dayCellPressable}
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
                      {entry.dishes.map((d) => d.dishName).filter(Boolean).join('・') || entry.note || '入力済み'}
                    </Text>
                    {entry.note && entry.dishes.some((d) => d.dishName) ? (
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

            {entry && onDishAdd && (
              <TouchableOpacity
                style={styles.addDishIconBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDishAdd(dayKey);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add-circle-outline" size={22} color="#E8692A" />
              </TouchableOpacity>
            )}
          </View>
          </Swipeable>
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
  dayCellPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addDishIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 14,
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
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'stretch',
    marginVertical: 0,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
