import React from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LogOut, User, Mail, ShieldAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DieticianSettingsScreen() {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 20 }]}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.brandForest + '10' }]}>
          <User size={48} color={theme.brandForest} />
        </View>
        <Text style={styles.profileName}>{user?.name || 'Dietician Workspace'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: theme.brandSage + '15' }]}>
          <Text style={[styles.roleText, { color: theme.brandForest }]}>{user?.role || 'DIETICIAN'}</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={[styles.infoRow, { borderBottomColor: '#f1f5f9' }]}>
          <Mail size={18} color="#64748b" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not Available'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <ShieldAlert size={18} color="#64748b" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoValue, { color: '#10b981', fontWeight: '800' }]}>ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity 
        style={[styles.signOutButton, { borderColor: '#ef4444' }]} 
        onPress={logout}
      >
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Brand Watermark */}
      <View style={styles.footer}>
        <Image 
          source={require('@/assets/images/brand-logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={styles.versionText}>NutriVibes Dietician Workspace v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    height: 52,
    borderRadius: 16,
    gap: 10,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  logo: {
    width: 150,
    height: 50,
    opacity: 0.4,
  },
  versionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
