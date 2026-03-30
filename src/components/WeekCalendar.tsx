import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { DayKey, WeekMenu } from '../types';
import { DAY_KEYS, getWeekDates } from '../utils/weekUtils';

interface Props {
  weekKey: string;
  weekMenu: WeekMenu | null;
  onDayPress: (day: DayKey) => void;
  onDayDelete?: (day: DayKey) => void;
}

export default function WeekCalendar({ weekKey, weekMenu, onDayPress, onDayDelete }: Props) {
  const { t } = useTranslation();
  const dates = getWeekDates(weekKey);
  const swipeRefs = useRef<Map<DayKey, Swipeable | null>>(new Map());
  const swipeActiveRef = useRef<Map<DayKey, boolean>>(new Map());

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
          <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
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
            onSwipeableWillOpen={() => { swipeActiveRef.current.set(dayKey, true); }}
            onSwipeableClose={() => { swipeActiveRef.current.set(dayKey, false); }}
          >
          <View style={styles.dayCell}>
            <TouchableOpacity
              style={styles.dayCellPressable}
              onPress={() => {
                if (swipeActiveRef.current.get(dayKey)) {
                  swipeRefs.current.get(dayKey)?.close();
                  return;
                }
                onDayPress(dayKey);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabelText, isWeekend && styles.weekend]}>
                  {t(`days.short.${dayKey}`)}
                </Text>
                <Text style={[styles.dateText, isWeekend && styles.weekend]}>
                  {date.getMonth() + 1}/{date.getDate()}
                </Text>
              </View>

              <View style={[styles.entryArea, entry && styles.entryFilled]}>
                {entry ? (
                  <>
                    <Text style={styles.dishName} numberOfLines={2}>
                      {entry.dishes.map((d) => d.dishName).filter(Boolean).join('・') || entry.note || t('entry.entered')}
                    </Text>
                    {entry.note && entry.dishes.some((d) => d.dishName) ? (
                      <Text style={styles.noteText} numberOfLines={1}>
                        {entry.note}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.emptyText}>{t('entry.tapToEnter')}</Text>
                )}
              </View>
            </TouchableOpacity>

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
