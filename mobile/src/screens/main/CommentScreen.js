// CommentScreen.js — Yorumlar · mini avatar, optimistic gönderim, düzenle/sil, klavye uyumlu
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DisplayNameWithStars from '../../components/DisplayNameWithStars';
import { Avatar } from '../../components/sf/ui';
import { colors, font } from '../../theme/socialFitTheme';

export default function CommentScreen({ route }) {
  const { postId } = route.params || {};
  const api = useApi();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // düzenlenen yorum
  const listRef = useRef(null);

  const load = useCallback(async () => {
    if (!postId) return;
    try {
      const data = await api.get(`/api/posts/${postId}/comments`);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      // hata olursa eldeki listeyi koru
    } finally {
      setLoading(false);
    }
  }, [postId, api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setBody('');

    // Düzenleme modu — optimistic güncelle, hata olursa geri al
    if (editing) {
      const prev = comments;
      const target = editing;
      setEditing(null);
      setComments((cs) => cs.map((c) => (c.id === target.id ? { ...c, body: text } : c)));
      try {
        const updated = await api.patch(`/api/posts/${postId}/comments/${target.id}`, { body: text });
        setComments((cs) => cs.map((c) => (c.id === target.id ? { ...c, ...updated } : c)));
      } catch (e) {
        setComments(prev);
        setBody(text);
        Alert.alert('Hata', 'Yorum güncellenemedi.');
      }
      return;
    }

    // Yeni yorum — optimistic ekle (kendi profilinle), cevap gelince değiştir
    const temp = {
      id: `temp-${Date.now()}`,
      body: text,
      pending: true,
      user: { id: user?.id, profile: user?.profile, starPoints: undefined },
      canEdit: false,
      canDelete: false,
    };
    setComments((cs) => [...cs, temp]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
    try {
      const comment = await api.post(`/api/posts/${postId}/comments`, { body: text });
      setComments((cs) => cs.map((c) => (c.id === temp.id ? comment : c)));
    } catch (e) {
      setComments((cs) => cs.filter((c) => c.id !== temp.id));
      setBody(text);
      Alert.alert('Hata', 'Yorum gönderilemedi.');
    }
  };

  const removeComment = (item) => {
    Alert.alert('Yorumu sil', 'Bu yorum kalıcı olarak silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          const prev = comments;
          setComments((cs) => cs.filter((c) => c.id !== item.id));
          if (editing?.id === item.id) { setEditing(null); setBody(''); }
          api.delete(`/api/posts/${postId}/comments/${item.id}`).catch(() => {
            setComments(prev);
            Alert.alert('Hata', 'Yorum silinemedi.');
          });
        },
      },
    ]);
  };

  const openActions = (item) => {
    if (item.pending || (!item.canEdit && !item.canDelete)) return;
    const buttons = [];
    if (item.canEdit) buttons.push({ text: 'Düzenle', onPress: () => { setEditing(item); setBody(item.body); } });
    if (item.canDelete) buttons.push({ text: 'Sil', style: 'destructive', onPress: () => removeComment(item) });
    buttons.push({ text: 'İptal', style: 'cancel' });
    Alert.alert('Yorum', undefined, buttons);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        ref={listRef}
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 6 }}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            : <Text style={styles.empty}>Henüz yorum yok — ilk yorumu sen yaz!</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => openActions(item)}
            style={[styles.comment, item.pending && { opacity: 0.55 }]}
          >
            <Avatar profile={item.user?.profile} name={item.user?.profile?.displayName} size={34} round />
            <View style={{ flex: 1 }}>
              <DisplayNameWithStars
                displayName={item.user?.profile?.displayName}
                starPoints={item.user?.starPoints}
                nameStyle={styles.author}
              />
              <Text style={styles.body}>{item.body}</Text>
            </View>
            {(item.canEdit || item.canDelete) && !item.pending ? (
              <TouchableOpacity hitSlop={10} onPress={() => openActions(item)}>
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.faint} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        )}
      />

      {editing ? (
        <View style={styles.editBanner}>
          <Ionicons name="pencil" size={13} color={colors.primary} />
          <Text style={styles.editBannerText} numberOfLines={1}>Yorum düzenleniyor</Text>
          <TouchableOpacity onPress={() => { setEditing(null); setBody(''); }} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={editing ? 'Yorumu düzenle...' : 'Yorum yaz...'}
          placeholderTextColor={colors.faint}
          value={body}
          onChangeText={setBody}
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={submit} disabled={!body.trim()}>
          <Ionicons name={editing ? 'checkmark-circle' : 'send'} size={22} color={body.trim() ? colors.primary : colors.faint} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  author: { fontFamily: font.bodyBold, fontSize: 13.5, color: colors.ink, marginBottom: 2 },
  body: { fontFamily: font.body, fontSize: 14, color: colors.text, lineHeight: 20 },
  empty: { textAlign: 'center', padding: 24, color: colors.muted, fontFamily: font.body },
  editBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.mintSoft, paddingHorizontal: 14, paddingVertical: 8 },
  editBannerText: { flex: 1, fontSize: 12.5, color: colors.primary, fontFamily: font.bodyBold },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, fontFamily: font.body, fontSize: 14, color: colors.ink },
  sendBtn: { justifyContent: 'center', paddingHorizontal: 6 },
});
