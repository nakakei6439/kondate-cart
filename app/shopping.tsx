import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SettingsModal } from '../src/components/SettingsModal';
import ShoppingItemComp from '../src/components/ShoppingItem';
import { useInterstitialAd } from '../src/hooks/useInterstitialAd';
import { useShoppingStore } from '../src/store/shoppingStore';
import { loadWeekMenu } from '../src/storage/menuStorage';
import { WeekMenu } from '../src/types';
import { getCurrentWeekKey, nextWeekKey } from '../src/utils/weekUtils';

export default function ShoppingScreen() {
  const router = useRouter();
  const { mode, items, setMode, generate, forceGenerate, addItem, toggleItem, removeByName } = useShoppingStore();
  const { showAd } = useInterstitialAd();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  // 来週・再来週のキー（買い物リストの対象週）
  const upcomingWeekKey = nextWeekKey(getCurrentWeekKey());
  const weekAfterNextKey = nextWeekKey(upcomingWeekKey);

  async function fetchAndGenerate(selectedMode: typeof mode, force = false) {
    const menus: WeekMenu[] = [];
    const nextMenu = await loadWeekMenu(upcomingWeekKey);
    if (nextMenu) menus.push(nextMenu);
    if (selectedMode === 'twoWeeks') {
      const weekAfterNextMenu = await loadWeekMenu(weekAfterNextKey);
      if (weekAfterNextMenu) menus.push(weekAfterNextMenu);
    }
    if (force) forceGenerate(menus);
    else generate(menus);
  }

  useEffect(() => {
    fetchAndGenerate(mode);
  }, [mode]);

  function handleAddItem() {
    if (!newItemName.trim()) return;
    addItem(newItemName.trim(), newItemAmount.trim());
    setNewItemName('');
    setNewItemAmount('');
    setShowAddModal(false);
  }

  function openAddModal() {
    setNewItemName('');
    setNewItemAmount('');
    setShowAddModal(true);
  }

  function handleRegenerate() {
    Alert.alert(
      'リストを再生成',
      '献立の材料からリストを作り直します。手動で削除した項目も元に戻ります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '再生成する', onPress: () => showAd(() => fetchAndGenerate(mode, true)) },
      ]
    );
  }

  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Large Title */}
      <View style={styles.titleArea}>
        <Text style={styles.largeTitle}>買い物リスト</Text>
        <View style={styles.titleButtons}>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={18} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />

      {/* モード切替 */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'nextWeek' && styles.segmentActive]}
          onPress={() => setMode('nextWeek')}
        >
          <Text style={[styles.segmentText, mode === 'nextWeek' && styles.segmentTextActive]}>
            来週
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'twoWeeks' && styles.segmentActive]}
          onPress={() => setMode('twoWeeks')}
        >
          <Text style={[styles.segmentText, mode === 'twoWeeks' && styles.segmentTextActive]}>
            再来週まで
          </Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={56} color="#1C1C1E" />
          <Text style={styles.emptyTitle}>材料がありません</Text>
          <Text style={styles.emptyDesc}>
            献立タブで来週の料理と{'\n'}材料を登録してください
          </Text>
          <TouchableOpacity style={styles.emptyHint} onPress={() => router.push('/')}>
            <View style={styles.emptyHintRow}>
              <Ionicons name="restaurant-outline" size={16} color="#E8692A" />
              <Text style={styles.emptyHintText}>献立タブから登録できます</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          <Text style={styles.countText}>
            {uncheckedItems.length}品目
            {checkedItems.length > 0 && `（購入済み ${checkedItems.length}品目）`}
          </Text>

          {uncheckedItems.map((item) => (
            <ShoppingItemComp
              key={item.name}
              item={item}
              onToggle={() => toggleItem(item.name)}
              onRemove={() => removeByName(item.name)}
            />
          ))}

          {checkedItems.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>購入済み</Text>
              </View>
              {checkedItems.map((item) => (
                <ShoppingItemComp
                  key={item.name}
                  item={item}
                  onToggle={() => toggleItem(item.name)}
                  onRemove={() => removeByName(item.name)}
                />
              ))}
            </>
          )}

          {/* フッター（再生成ボタン）の高さ分の余白 */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerate}>
          <Text style={styles.regenerateBtnText}>↺  再生成</Text>
        </TouchableOpacity>
      </View>

      {/* 手動追加モーダル */}
      <Modal transparent animationType="none" visible={showAddModal} onRequestClose={() => setShowAddModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKav}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>アイテムを追加</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>品目名</Text>
              <TextInput
                style={styles.modalInput}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="例: 醤油"
                placeholderTextColor="#C7C7CC"
                autoFocus
                returnKeyType="next"
              />
              <Text style={[styles.modalLabel, { marginTop: 14 }]}>量（任意）</Text>
              <TextInput
                style={styles.modalInput}
                value={newItemAmount}
                onChangeText={setNewItemAmount}
                placeholder="例: 1本"
                placeholderTextColor="#C7C7CC"
                returnKeyType="done"
                onSubmitEditing={handleAddItem}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalAddBtn, !newItemName.trim() && styles.modalAddBtnDisabled]}
                onPress={handleAddItem}
                disabled={!newItemName.trim()}
              >
                <Text style={styles.modalAddBtnText}>追加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#F2F2F7',
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  titleButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8692A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '400',
    lineHeight: 24,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#E0E0E5',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  countText: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyHint: {
    marginTop: 20,
    backgroundColor: '#FFF4EE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptyHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyHintText: {
    fontSize: 14,
    color: '#E8692A',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  regenerateBtn: {
    backgroundColor: '#E8692A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#E8692A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  regenerateBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // 手動追加モーダル
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalKav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalCloseBtn: { padding: 4 },
  modalCloseBtnText: { fontSize: 18, color: '#8E8E93' },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
  },
  modalAddBtn: {
    height: 50,
    backgroundColor: '#E8692A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E8692A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalAddBtnDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  modalAddBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
