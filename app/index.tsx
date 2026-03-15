import { Ionicons } from '@expo/vector-icons';
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
import { SettingsModal } from '../src/components/SettingsModal';
import WeekCalendar from '../src/components/WeekCalendar';
import { DayKey, DayRecord } from '../src/types';
import { useDishStore } from '../src/store/dishStore';
import { useMenuStore } from '../src/store/menuStore';
import {
  formatWeekTitle,
  getCurrentWeekKey,
  nextWeekKey,
  prevWeekKey,
} from '../src/utils/weekUtils';

export default function MenuScreen() {
  const { weekKey, weekMenu, setWeekKey, loadWeekMenu, saveDayRecord, clearDayRecord, clearWeekMenu } =
    useMenuStore();
  const { dishes, initialized, loadDishes, upsertDish } = useDishStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

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
    async (day: DayKey, record: DayRecord) => {
      await saveDayRecord(day, record);
      // 各料理を履歴に登録
      for (const dish of record.dishes) {
        if (dish.dishName.trim()) {
          await upsertDish(dish.dishName.trim(), dish.ingredients);
        }
      }
    },
    [saveDayRecord, upsertDish]
  );

  const handleClear = useCallback(
    async (day: DayKey) => {
      await clearDayRecord(day);
    },
    [clearDayRecord]
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
      {/* Header */}
      <View style={styles.titleArea}>
        <View style={styles.titleSpacer} />
        <View style={styles.titleCenter}>
          <Text style={styles.appTitle}>献立カート</Text>
          <Text style={styles.appSubtitle}>週の献立を計画しよう</Text>
        </View>
        <View style={styles.titleRight}>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color="#8E8E93" />
          </TouchableOpacity>
          {hasAnyEntry && (
            <TouchableOpacity onPress={handleClearWeek} style={styles.clearWeekBtn}>
              <Ionicons name="trash-outline" size={22} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
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

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
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
  titleSpacer: {
    width: 44,
  },
  titleCenter: {
    flex: 1,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E8692A',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsBtn: {
    padding: 8,
  },
  clearWeekBtn: {
    padding: 8,
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
