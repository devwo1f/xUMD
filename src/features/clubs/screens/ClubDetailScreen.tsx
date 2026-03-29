import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import BottomSheet from '../../../shared/components/BottomSheet';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import EventCard from '../../../shared/components/EventCard';
import Input from '../../../shared/components/Input';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import ClubTabs from '../components/ClubTabs';
import JoinRequestCard from '../components/JoinRequestCard';
import { mockClubs, mockUsers } from '../../../assets/data/mockClubs';
import { useAuth } from '../../auth/hooks/useAuth';
import { useClubs } from '../hooks/useClubs';
import { useClubAdmin } from '../stores/useClubAdminStore';
import {
  canRemoveClubMember,
  canTransferOwnership,
  getAssignableRoles,
  getClubPermissions,
  getRoleLabel,
} from '../utils/permissions';
import { useFeedStore } from '../../feed/hooks/useFeed';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ClubMemberWithUser, MemberRole, UserProfile } from '../../../shared/types';
import type { ClubsStackParamList, ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ClubsStackParamList & ProfileStackParamList, 'ClubDetail'>;
type SheetMode = 'announcement' | 'media' | 'post' | 'member' | null;

const tabs = ['About', 'Events', 'Media', 'Members'];

function getRoleBadgeColor(role: MemberRole) {
  if (role === 'president') return colors.primary.main;
  if (role === 'admin') return colors.status.info;
  if (role === 'officer') return colors.status.success;
  return colors.gray[700];
}

export default function ClubDetailScreen({ navigation, route }: Props) {
  const [activeTab, setActiveTab] = useState('About');
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [selectedMember, setSelectedMember] = useState<ClubMemberWithUser | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [postContent, setPostContent] = useState('');

  const { user: authUser } = useAuth();
  const { getClubById, getClubEvents } = useClubs();
  const { joinedClubIds, toggleJoinedClub } = useDemoAppStore();
  const club = getClubById(route.params.clubId) ?? mockClubs.find((item) => item.id === route.params.clubId);

  const fallbackUser = useMemo(
    () => mockUsers.find((user) => user.id === 'user-001') ?? mockUsers[0] ?? null,
    [],
  );
  const currentUser = (authUser ?? fallbackUser) as UserProfile | null;
  const currentUserId = currentUser?.id ?? 'user-001';

  const clubAdmin = useClubAdmin();
  const {
    setCurrentUserId: syncCurrentUserId,
    approveJoinRequest,
    rejectJoinRequest,
    removeMember,
    setMemberRole,
    transferOwnership,
    addAnnouncement,
    addMedia,
  } = clubAdmin;
  const createPost = useFeedStore((state) => state.createPost);
  const clubPosts = useFeedStore((state) =>
    state.posts
      .filter((post) => post.club_id === route.params.clubId)
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),
  );

  useEffect(() => {
    syncCurrentUserId(currentUserId);
  }, [currentUserId, syncCurrentUserId]);

  const events = useMemo(() => (club ? getClubEvents(club.id) : []), [club, getClubEvents]);
  const members = useMemo(() => (club ? clubAdmin.getMembers(club.id) : []), [club, clubAdmin]);
  const requests = useMemo(() => (club ? clubAdmin.getJoinRequests(club.id) : []), [club, clubAdmin]);
  const media = useMemo(() => (club ? clubAdmin.getMedia(club.id) : []), [club, clubAdmin]);
  const announcements = useMemo(
    () => (club ? clubAdmin.getAnnouncements(club.id) : []),
    [club, clubAdmin],
  );
  const memberCountDelta = useMemo(
    () => (club ? clubAdmin.getMemberCountDelta(club.id) : 0),
    [club, clubAdmin],
  );

  if (!club) {
    return (
      <ScreenLayout
        title="Club"
        subtitle="We couldn't find that organization."
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        }
      >
        <Card>
          <Text style={styles.bodyText}>Head back to the clubs list and try another one.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const memberCount = Math.max(club.member_count + memberCountDelta, members.length);
  const leader = members.find((member) => member.role === 'president') ?? members[0];
  const currentMembership = members.find((member) => member.user_id === currentUserId) ?? null;
  const permissions = getClubPermissions(currentMembership?.role);
  const isJoined = joinedClubIds.includes(club.id);

  const roleTargets = selectedMember
    ? getAssignableRoles(currentMembership?.role, selectedMember.role, currentUserId, selectedMember.user_id)
    : [];
  const canRemoveSelectedMember = selectedMember
    ? canRemoveClubMember(currentMembership?.role, selectedMember.role, currentUserId, selectedMember.user_id)
    : false;
  const canTransferSelectedMemberOwnership = selectedMember
    ? canTransferOwnership(currentMembership?.role, currentUserId, selectedMember.user_id)
    : false;

  const closeSheet = () => {
    setSheetMode(null);
    setSelectedMember(null);
    setAnnouncementTitle('');
    setAnnouncementBody('');
    setMediaUrl('');
    setMediaCaption('');
    setPostContent('');
  };

  const publishAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementBody.trim() || !currentUser) return;
    addAnnouncement({
      clubId: club.id,
      title: announcementTitle,
      body: announcementBody,
      authorId: currentUser.id,
      authorName: currentUser.display_name,
    });
    closeSheet();
  };

  const publishPost = () => {
    if (!postContent.trim() || !currentUser) return;
    createPost({
      authorId: currentUser.id,
      author: currentUser,
      clubId: club.id,
      content: postContent,
      type: 'club_update',
    });
    closeSheet();
  };

  const publishMedia = () => {
    if (!mediaUrl.trim() || !mediaCaption.trim()) return;
    addMedia({ clubId: club.id, url: mediaUrl, caption: mediaCaption });
    closeSheet();
  };

  const changeRole = (role: MemberRole) => {
    if (!selectedMember) return;
    setMemberRole(club.id, selectedMember.user_id, role);
    closeSheet();
  };

  const removeSelectedMember = () => {
    if (!selectedMember) return;
    removeMember(club.id, selectedMember.user_id);
    closeSheet();
  };

  const makeOwner = () => {
    if (!selectedMember) return;
    transferOwnership(club.id, selectedMember.user_id);
    closeSheet();
  };

  return (
    <>
      <ScreenLayout
        title="Club"
        subtitle="Meet the team and what they are building."
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        }
        rightAction={
          <Pressable style={styles.backButton}>
            <Ionicons name="share-social-outline" size={20} color={colors.text.primary} />
          </Pressable>
        }
      >
        {club.cover_url ? <Image source={{ uri: club.cover_url }} style={styles.coverImage} /> : null}

        <Card>
          <View style={styles.topRow}>
            <Avatar uri={club.logo_url} name={club.name} size="xl" />
            <View style={styles.clubCopy}>
              <Text style={styles.clubName}>{club.name}</Text>
              <View style={styles.badgeRow}>
                <Badge label={club.category} color={colors.clubCategory[club.category as keyof typeof colors.clubCategory] ?? colors.primary.main} />
                <Badge label={`${memberCount} members`} color={colors.gray[700]} variant="outlined" />
              </View>
            </View>
          </View>
          <Text style={styles.description}>{club.short_description}</Text>
          <View style={styles.accessRow}>
            <View style={styles.accessCopy}>
              <Text style={styles.accessLabel}>Your access</Text>
              <Text style={styles.accessValue}>{permissions.roleLabel}</Text>
            </View>
            <Badge
              label={permissions.canManageMembers ? 'Admin tools' : permissions.isMember ? 'Member' : 'Guest'}
              color={permissions.canManageMembers ? colors.status.info : permissions.isMember ? colors.status.success : colors.gray[600]}
            />
          </View>
          <View style={styles.actionButtons}>
            <Button title={isJoined ? 'Joined' : 'Join Club'} onPress={() => toggleJoinedClub(club.id)} fullWidth />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Club snapshot</Text>
          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{memberCount}</Text>
              <Text style={styles.snapshotLabel}>Members</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{events.length}</Text>
              <Text style={styles.snapshotLabel}>Events</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>{media.length}</Text>
              <Text style={styles.snapshotLabel}>Media</Text>
            </View>
          </View>
        </Card>

        {permissions.canPost || permissions.canAnnounce || permissions.canUploadMedia ? (
          <Card style={styles.adminCard}>
            <Text style={styles.sectionTitle}>Admin studio</Text>
            <Text style={styles.bodyText}>Post updates, make announcements, and keep the gallery fresh.</Text>
            <View style={styles.adminActions}>
              {permissions.canPost ? <Button title="New Post" size="sm" onPress={() => setSheetMode('post')} /> : null}
              {permissions.canAnnounce ? <Button title="Announcement" size="sm" variant="secondary" onPress={() => setSheetMode('announcement')} /> : null}
              {permissions.canUploadMedia ? <Button title="Add Media" size="sm" variant="ghost" onPress={() => setSheetMode('media')} /> : null}
            </View>
          </Card>
        ) : null}

        <View style={styles.tabShell}>
          <ClubTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <View style={styles.tabContent}>
            {activeTab === 'About' ? (
              <>
                <Text style={styles.bodyText}>{club.description}</Text>
                <Card style={styles.infoCard}>
                  <Text style={styles.cardLabel}>Meeting Schedule</Text>
                  <Text style={styles.cardValue}>{club.meeting_schedule ?? 'TBD'}</Text>
                </Card>
                <Card style={styles.infoCard}>
                  <Text style={styles.cardLabel}>Contact</Text>
                  <Text style={styles.cardValue}>{club.contact_email ?? 'Not listed'}</Text>
                </Card>
                {leader ? (
                  <Card>
                    <Text style={styles.cardLabel}>Leadership</Text>
                    <View style={styles.memberRow}>
                      <Avatar uri={leader.user.avatar_url} name={leader.user.display_name} size="md" />
                      <View style={styles.memberCopy}>
                        <Text style={styles.memberName}>{leader.user.display_name}</Text>
                        <Text style={styles.memberMeta}>{getRoleLabel(leader.role)}</Text>
                      </View>
                    </View>
                  </Card>
                ) : null}
                <Card>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Announcements</Text>
                    {permissions.canAnnounce ? (
                      <Pressable onPress={() => setSheetMode('announcement')} style={styles.inlineAction}>
                        <Ionicons name="add-circle-outline" size={18} color={colors.primary.main} />
                        <Text style={styles.inlineActionText}>New</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {announcements.length > 0 ? (
                    <View style={styles.stack}>
                      {announcements.map((announcement) => (
                        <View key={announcement.id} style={styles.notice}>
                          <View style={styles.noticeHeader}>
                            <Text style={styles.noticeTitle}>{announcement.title}</Text>
                            <Text style={styles.noticeMeta}>{format(new Date(announcement.created_at), 'MMM d')}</Text>
                          </View>
                          <Text style={styles.bodyText}>{announcement.body}</Text>
                          <Text style={styles.noticeMeta}>Posted by {announcement.author_name}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.bodyText}>No club announcements yet.</Text>
                  )}
                </Card>
                <Card>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Recent Posts</Text>
                    {permissions.canPost ? (
                      <Pressable onPress={() => setSheetMode('post')} style={styles.inlineAction}>
                        <Ionicons name="add-circle-outline" size={18} color={colors.primary.main} />
                        <Text style={styles.inlineActionText}>Publish</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {clubPosts.length > 0 ? (
                    <View style={styles.stack}>
                      {clubPosts.slice(0, 3).map((post) => (
                        <View key={post.id} style={styles.notice}>
                          <View style={styles.noticeHeader}>
                            <Text style={styles.noticeTitle}>{post.author?.display_name ?? 'Club team'}</Text>
                            <Text style={styles.noticeMeta}>{format(new Date(post.created_at), 'MMM d, h:mm a')}</Text>
                          </View>
                          <Text style={styles.bodyText}>{post.content}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.bodyText}>No club posts yet.</Text>
                  )}
                </Card>
              </>
            ) : null}
            {activeTab === 'Events' ? (
              <View style={styles.stack}>
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={{
                      id: event.id,
                      title: event.title,
                      imageUri: event.image_url ?? undefined,
                      category: event.category,
                      time: format(new Date(event.starts_at), 'EEE, MMM d h:mm a'),
                      location: event.location_name,
                    }}
                  />
                ))}
              </View>
            ) : null}
            {activeTab === 'Media' ? (
              <>
                {permissions.canUploadMedia ? (
                  <Card style={styles.infoCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Gallery manager</Text>
                      <Button title="Add Media" size="sm" onPress={() => setSheetMode('media')} />
                    </View>
                    <Text style={styles.bodyText}>Keep the club page active with fresh media.</Text>
                  </Card>
                ) : null}
                <View style={styles.mediaGrid}>
                  {media.map((item) => (
                    <View key={item.id} style={styles.mediaTile}>
                      <Image source={{ uri: item.url }} style={styles.mediaImage} />
                      <Text style={styles.mediaCaption} numberOfLines={2}>{item.caption}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
            {activeTab === 'Members' ? (
              <View style={styles.stack}>
                {permissions.canManageMembers ? (
                  <Card style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Member access</Text>
                    <Text style={styles.bodyText}>Promote members, clean up the roster, and hand off leadership here.</Text>
                  </Card>
                ) : null}
                {members.map((member) => {
                  const canManageMember =
                    getAssignableRoles(currentMembership?.role, member.role, currentUserId, member.user_id).length > 0 ||
                    canRemoveClubMember(currentMembership?.role, member.role, currentUserId, member.user_id) ||
                    canTransferOwnership(currentMembership?.role, currentUserId, member.user_id);

                  return (
                    <Card key={member.user_id} style={styles.memberCard}>
                      <View style={styles.memberCardTopRow}>
                        <View style={styles.memberRow}>
                          <Avatar uri={member.user.avatar_url} name={member.user.display_name} size="md" />
                          <View style={styles.memberCopy}>
                            <Text style={styles.memberName}>{member.user.display_name}</Text>
                            <Text style={styles.memberMeta}>
                              {member.user.major ?? 'Undeclared'}
                              {member.user.graduation_year ? ` - Class of ${member.user.graduation_year}` : ''}
                            </Text>
                          </View>
                        </View>
                        {canManageMember ? (
                          <Pressable style={styles.manageButton} onPress={() => {
                            setSelectedMember(member);
                            setSheetMode('member');
                          }}>
                            <Text style={styles.manageButtonText}>Manage</Text>
                          </Pressable>
                        ) : null}
                      </View>
                      <View style={styles.badgeRow}>
                        <Badge label={getRoleLabel(member.role)} color={getRoleBadgeColor(member.role)} />
                        {member.user_id === currentUserId ? <Badge label="You" color={colors.gray[700]} variant="outlined" /> : null}
                      </View>
                    </Card>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>

        {permissions.canApproveRequests ? (
          requests.length > 0 ? (
            <View style={styles.stack}>
              <Text style={styles.sectionTitle}>Pending Join Requests</Text>
              {requests.map((request) => (
                <JoinRequestCard
                  key={request.id}
                  user={request.user}
                  requestedAt={request.requested_at}
                  onApprove={() => approveJoinRequest(club.id, request.user.id)}
                  onReject={() => rejectJoinRequest(club.id, request.user.id)}
                />
              ))}
            </View>
          ) : (
            <Card style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Pending Join Requests</Text>
              <Text style={styles.bodyText}>No membership requests are waiting right now.</Text>
            </Card>
          )
        ) : null}
      </ScreenLayout>

      <BottomSheet visible={sheetMode !== null} onClose={closeSheet} snapPoints={[0.62, 0.8]}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {sheetMode === 'announcement' ? (
            <>
              <Text style={styles.sheetTitle}>New Announcement</Text>
              <Text style={styles.bodyText}>Pin a clear update for members and applicants.</Text>
              <Input label="Title" value={announcementTitle} onChangeText={setAnnouncementTitle} placeholder="Workshop moved to a new room" maxLength={80} />
              <Input label="Message" value={announcementBody} onChangeText={setAnnouncementBody} placeholder="Share the update members need to know." multiline maxLength={220} />
              <Button title="Publish Announcement" onPress={publishAnnouncement} disabled={!announcementTitle.trim() || !announcementBody.trim()} fullWidth />
            </>
          ) : null}
          {sheetMode === 'post' ? (
            <>
              <Text style={styles.sheetTitle}>New Club Post</Text>
              <Text style={styles.bodyText}>This goes into the main xUMD feed for your club.</Text>
              <Input label="Post copy" value={postContent} onChangeText={setPostContent} placeholder="What should the campus hear from your club today?" multiline maxLength={280} />
              <Button title="Publish Post" onPress={publishPost} disabled={!postContent.trim()} fullWidth />
            </>
          ) : null}
          {sheetMode === 'media' ? (
            <>
              <Text style={styles.sheetTitle}>Add Gallery Media</Text>
              <Text style={styles.bodyText}>Drop in a fresh image so the club page feels alive.</Text>
              <Input label="Image URL" value={mediaUrl} onChangeText={setMediaUrl} placeholder="https://..." />
              <Input label="Caption" value={mediaCaption} onChangeText={setMediaCaption} placeholder="Hack night prep before Bitcamp" maxLength={80} />
              <Button title="Add to Gallery" onPress={publishMedia} disabled={!mediaUrl.trim() || !mediaCaption.trim()} fullWidth />
            </>
          ) : null}
          {sheetMode === 'member' && selectedMember ? (
            <>
              <Text style={styles.sheetTitle}>Manage Member</Text>
              <Text style={styles.bodyText}>Adjust access for {selectedMember.user.display_name}.</Text>
              <Card style={styles.notice}>
                <View style={styles.memberRow}>
                  <Avatar uri={selectedMember.user.avatar_url} name={selectedMember.user.display_name} size="md" />
                  <View style={styles.memberCopy}>
                    <Text style={styles.memberName}>{selectedMember.user.display_name}</Text>
                    <Text style={styles.memberMeta}>{getRoleLabel(selectedMember.role)}</Text>
                  </View>
                </View>
              </Card>
              {roleTargets.length > 0 ? (
                <View style={styles.stack}>
                  {roleTargets.map((role) => (
                    <Button key={role} title={`Make ${getRoleLabel(role)}`} onPress={() => changeRole(role)} variant={role === 'admin' ? 'primary' : 'secondary'} fullWidth />
                  ))}
                </View>
              ) : null}
              {canTransferSelectedMemberOwnership ? (
                <Button title="Transfer Ownership" onPress={makeOwner} variant="secondary" fullWidth />
              ) : null}
              {canRemoveSelectedMember ? (
                <Button title="Remove Member" onPress={removeSelectedMember} variant="danger" fullWidth />
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.full, backgroundColor: colors.background.secondary },
  coverImage: { width: '100%', height: 220, borderRadius: borderRadius.lg },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  clubCopy: { flex: 1, marginLeft: spacing.md },
  clubName: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  description: { fontSize: typography.fontSize.base, lineHeight: 24, color: colors.text.secondary, marginTop: spacing.md },
  accessRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.background.secondary },
  accessCopy: { flex: 1 },
  accessLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.secondary, textTransform: 'uppercase' },
  accessValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginTop: spacing.xs },
  actionButtons: { marginTop: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  snapshotGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.md },
  snapshotItem: { flex: 1, borderRadius: borderRadius.md, backgroundColor: colors.background.secondary, padding: spacing.md },
  snapshotValue: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  snapshotLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing.xs },
  adminCard: { gap: spacing.md, borderWidth: 1, borderColor: colors.status.infoLight, backgroundColor: '#FBFDFF' },
  adminActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tabShell: { backgroundColor: colors.brand.white, borderRadius: borderRadius.lg, overflow: 'hidden' },
  tabContent: { padding: spacing.md, gap: spacing.md },
  bodyText: { fontSize: typography.fontSize.base, lineHeight: 24, color: colors.text.secondary },
  infoCard: { gap: spacing.xs },
  cardLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.secondary, textTransform: 'uppercase' },
  cardValue: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberCopy: { flex: 1, marginLeft: spacing.sm },
  memberName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  memberMeta: { fontSize: typography.fontSize.sm, color: colors.text.secondary, textTransform: 'capitalize', marginTop: 2 },
  memberCard: { paddingVertical: spacing.sm, gap: spacing.md },
  memberCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  manageButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.background.secondary },
  manageButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  stack: { gap: spacing.md },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  mediaTile: { width: '47%' },
  mediaImage: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.lg },
  mediaCaption: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing.sm, lineHeight: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  inlineActionText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.primary.main },
  notice: { padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.background.secondary, gap: spacing.sm },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  noticeTitle: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  noticeMeta: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  sheetContent: { paddingBottom: spacing.xl, gap: spacing.md },
  sheetTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
});


