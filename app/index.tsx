import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DayEntrySheet from '../src/components/DayEntrySheet';
import WeekCalendar from '../src/components/WeekCalendar';
import { DayEntry, DayKey } from '../src/types';
import { useDishStore } from '../src/store/dishStore';
import { useMenuStore } from '../src/store/menuStore';
import {
  formatWeekTitle,
  getCurrentWeekKey,
  nextWeekKey,
  prevWeekKey,
} from '../src/utils/weekUtils';

export default function MenuScreen() {
  const { weekKey, weekMenu, setWeekKey, loadWeekMenu, saveDayEntry, clearDayEntry, clearWeekMenu } =
    useMenuStore();
  const { dishes, initialized, loadDishes, upsertDish } = useDishStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);

  // 初期ロード
  useEffect(() => {
    if (!initialized) loadDishes();
  }, [initialized]);

  useEffect(() => {
    loadWeekMenu(weekKey);
  }, [weekKey]);

  const handleDayPress = useCallback(
    (day: DayKey) => {
      setSelectedDay(day);
      setSheetVisible(true);
    },
    []
  );

  const handleSave = useCallback(
    async (day: DayKey, entry: DayEntry) => {
      await saveDayEntry(day, entry);
      // 料理名がある場合は履歴に登録
      if (entry.dishName.trim()) {
        await upsertDish(entry.dishName.trim(), entry.ingredients);
      }
    },
    [saveDayEntry, upsertDish]
  );

  const handleClear = useCallback(
    async (day: DayKey) => {
      await clearDayEntry(day);
    },
    [clearDayEntry]
  );

  const currentKey = nextWeekKey(getCurrentWeekKey());
  const isCurrentWeek = weekKey === currentKey;

  const hasAnyEntry = weekMenu ? Object.keys(weekMenu.days).length > 0 : false;

  function handleClearWeek() {
    Alert.alert('献立を全削除', 'この週の献立を全て削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => clearWeekMenu(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Large Title */}
      <View style={styles.titleArea}>
        <Text style={styles.largeTitle}>献立</Text>
        {hasAnyEntry && (
          <TouchableOpacity onPress={handleClearWeek} style={styles.clearWeekBtn}>
            <Text style={styles.clearWeekBtnText}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ヘッダーナビ */}
      <View style={styles.nav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setWeekKey(prevWeekKey(weekKey))}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => isCurrentWeek ? null : setWeekKey(currentKey)}
          activeOpacity={isCurrentWeek ? 1 : 0.7}
        >
          <Text style={styles.weekTitle}>{formatWeekTitle(weekKey)}</Text>
          {!isCurrentWeek && (
            <Text style={styles.todayHint}>来週に戻る</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setWeekKey(nextWeekKey(weekKey))}
        >
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <WeekCalendar
          weekKey={weekKey}
          weekMenu={weekMenu}
          onDayPress={handleDayPress}
          onDayDelete={handleClear}
        />
      </ScrollView>

      <DayEntrySheet
        visible={sheetVisible}
        dayKey={selectedDay}
        initialEntry={selectedDay ? weekMenu?.days[selectedDay] ?? null : null}
        dishes={dishes}
        onSave={handleSave}
        onClear={handleClear}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  clearWeekBtn: {
    padding: 8,
  },
  clearWeekBtnText: {
    fontSize: 22,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  navBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 28,
    color: '#E8692A',
    fontWeight: '300',
  },
  weekTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  todayHint: {
    fontSize: 12,
    color: '#E8692A',
    textAlign: 'center',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
});
