import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Linking, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Phone, Mail, FileText, Calendar, Plus, RefreshCw, ChevronRight, Stethoscope } from 'lucide-react-native';
import { format } from 'date-fns';

interface FollowUpNote {
  _id?: string;
  date: string;
  notes: string;
}

interface ClientProfile {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  gender?: string;
  dob?: string;
  primaryGoal?: string[];
  counsellingProfile?: {
    medicalConditions?: string[];
    otherMedicalCondition?: string;
    allergies?: string[];
    deficiencies?: string[];
    otherDeficiency?: string;
    stapleFood?: string;
    lifestyleNotes?: string;
  };
  followUpHistory?: FollowUpNote[];
}

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchClientData = async () => {
    try {
      const data = await api.get<ClientProfile>(`/api/clients/${id}`);
      setClient(data);
    } catch (error) {
      console.error('Failed to fetch client profile:', error);
      Alert.alert('Error', 'Could not load client profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const handleAddFollowUp = async () => {
    if (!noteText.trim()) {
      Alert.alert('Validation', 'Please enter some note content.');
      return;
    }

    setSavingNote(true);
    try {
      await api.post(`/api/clients/${id}/follow-up`, { notes: noteText.trim() });
      setNoteText('');
      Alert.alert('Success', 'Follow-up note logged successfully.');
      fetchClientData(); // Refresh history
    } catch (error) {
      console.error('Failed to add follow-up:', error);
      Alert.alert('Error', 'Could not log follow-up note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCall = () => {
    if (client?.phone) {
      Linking.openURL(`tel:${client.phone}`);
    } else {
      Alert.alert('Unavailable', 'No phone number provided.');
    }
  };

  const handleEmail = () => {
    if (client?.email) {
      Linking.openURL(`mailto:${client.email}`);
    } else {
      Alert.alert('Unavailable', 'No email address provided.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.brandForest} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ fontWeight: '600' }}>Client not found.</Text>
      </View>
    );
  }

  const cp = client.counsellingProfile;
  const history = client.followUpHistory ? [...client.followUpHistory].reverse() : [];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={[styles.card, { borderColor: theme.brandForest + '10' }]}>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientMeta}>
          {client.gender ? `${client.gender}` : ''}
          {client.dob ? ` • ${format(new Date(client.dob), 'dd MMM yyyy')}` : ''}
        </Text>

        <View style={[styles.statusBadge, { backgroundColor: client.status === 'ACTIVE' ? '#ecfdf5' : '#fef3c7' }]}>
          <Text style={[styles.statusText, { color: client.status === 'ACTIVE' ? '#10b981' : '#d97706' }]}>
            {client.status}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: '#e2e8f0' }]} />

        {/* Contact info row */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={[styles.contactButton, { backgroundColor: theme.brandForest + '10' }]} onPress={handleCall}>
            <Phone size={16} color={theme.brandForest} />
            <Text style={[styles.contactText, { color: theme.brandForest }]}>Call Client</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactButton, { backgroundColor: theme.brandForest + '10' }]} onPress={handleEmail}>
            <Mail size={16} color={theme.brandForest} />
            <Text style={[styles.contactText, { color: theme.brandForest }]}>Email Client</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggest Diet CTA */}
      <TouchableOpacity 
        style={[styles.ctaButton, { backgroundColor: theme.brandForest }]}
        onPress={() => router.push(`/(dietician)/clients/${id}/suggest-diet` as any)}
      >
        <Calendar size={20} color="#fff" />
        <Text style={styles.ctaButtonText}>Suggest Weekly Diet Plan</Text>
        <ChevronRight size={18} color="#fff" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {/* Clinical Profile Section */}
      <View style={[styles.sectionCard, { borderColor: theme.brandForest + '10' }]}>
        <View style={styles.sectionHeader}>
          <Stethoscope size={18} color={theme.brandForest} />
          <Text style={[styles.sectionTitle, { color: theme.brandForest }]}>Clinical Details</Text>
        </View>

        <View style={styles.clinicalGrid}>
          <View style={styles.clinicalItem}>
            <Text style={styles.clinicalLabel}>Conditions</Text>
            <Text style={styles.clinicalValue}>
              {cp?.medicalConditions && cp.medicalConditions.length > 0
                ? cp.medicalConditions.join(', ')
                : 'None'}
              {cp?.otherMedicalCondition ? ` (${cp.otherMedicalCondition})` : ''}
            </Text>
          </View>

          <View style={styles.clinicalItem}>
            <Text style={styles.clinicalLabel}>Allergies</Text>
            <Text style={styles.clinicalValue}>
              {cp?.allergies && cp.allergies.length > 0 ? cp.allergies.join(', ') : 'None'}
            </Text>
          </View>

          <View style={styles.clinicalItem}>
            <Text style={styles.clinicalLabel}>Deficiencies</Text>
            <Text style={styles.clinicalValue}>
              {cp?.deficiencies && cp.deficiencies.length > 0
                ? cp.deficiencies.join(', ')
                : 'None'}
              {cp?.otherDeficiency ? ` (${cp.otherDeficiency})` : ''}
            </Text>
          </View>

          <View style={styles.clinicalItem}>
            <Text style={styles.clinicalLabel}>Staple Food</Text>
            <Text style={styles.clinicalValue}>{cp?.stapleFood || 'Not specified'}</Text>
          </View>
        </View>

        {cp?.lifestyleNotes && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.clinicalLabel}>Lifestyle Notes</Text>
            <Text style={styles.lifestyleNotes}>{cp.lifestyleNotes}</Text>
          </View>
        )}
      </View>

      {/* Log Follow-up Note Section */}
      <View style={[styles.sectionCard, { borderColor: theme.brandForest + '10' }]}>
        <View style={styles.sectionHeader}>
          <FileText size={18} color={theme.brandForest} />
          <Text style={[styles.sectionTitle, { color: theme.brandForest }]}>Log Follow-Up Notes</Text>
        </View>

        <TextInput
          placeholder="Type notes from today's counselling session here..."
          value={noteText}
          onChangeText={setNoteText}
          style={[styles.noteInput, { borderColor: '#cbd5e1', color: theme.text }]}
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity 
          style={[styles.saveNoteButton, { backgroundColor: theme.brandForest }]}
          onPress={handleAddFollowUp}
          disabled={savingNote}
        >
          {savingNote ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Plus size={16} color="#fff" />
              <Text style={styles.saveNoteText}>Add Notes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Follow-up History Feed */}
      <View style={[styles.sectionCard, { borderColor: theme.brandForest + '10' }]}>
        <View style={styles.sectionHeader}>
          <RefreshCw size={18} color={theme.brandForest} />
          <Text style={[styles.sectionTitle, { color: theme.brandForest }]}>Follow-Up History</Text>
        </View>

        {history.length > 0 ? (
          history.map((item, idx) => (
            <View key={item._id || idx} style={[styles.historyItem, idx !== history.length - 1 && { borderBottomColor: '#f1f5f9' }]}>
              <Text style={styles.historyDate}>
                {format(new Date(item.date), 'dd MMMM yyyy, hh:mm a')}
              </Text>
              <Text style={styles.historyNotes}>{item.notes}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHistory}>No previous follow-up history logged.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  clientName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  clientMeta: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 20,
    gap: 12,
    marginBottom: 20,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  clinicalGrid: {
    gap: 12,
  },
  clinicalItem: {
    gap: 2,
  },
  clinicalLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  clinicalValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  lifestyleNotes: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 2,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  saveNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 14,
    gap: 8,
  },
  saveNoteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 4,
  },
  historyDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  historyNotes: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 18,
  },
  emptyHistory: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});
