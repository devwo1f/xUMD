import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import EventCard from '../../../shared/components/EventCard';
import Input from '../../../shared/components/Input';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import ClubTabs from '../components/ClubTabs';
import JoinRequestCard from '../components/JoinRequestCard';
import {
  mockClubs,
  mockClubEvents,
  mockClubMedia,
  mockClubMembers,
  mockJoinRequests,
  mockUsers,
  type ClubMedia,
  type JoinRequest,
} from '../../../assets/data/mockClubs';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { MemberRole, MemberStatus } from '../../../shared/types';
import type { ClubMemberWithUser } from '../../../shared/types';
import type { ClubsStackParamList, ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ClubsStackParamList & ProfileStackParamList, 'ClubDetail'>;
type TabKey = 'About' | 'Events' | 'Media' | 'Members';

interface ClubAnnouncement {
  id: string;
  clubId: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
}

interface ClubPost {
  id: string;
  clubId: string;
  body: string;
  authorName: string;
  createdAt: string;
}

const tabs: TabKey[] = ['About', 'Events', 'Media', 'Members'];
const currentUser = mockUsers.find((user) => user.id === 'user-001') ?? mockUsers[0];
const initialAnnouncements: ClubAnnouncement[] = [
  {
    id: 'announcement-001',
    clubId: 'club-001',
    title: 'Bitcamp volunteer call',
    body: 'Officer applications for logistics, design, and hacker experience close Friday at 11:59 PM.',
    authorName: 'Alex Chen',
    createdAt: '2026-03-27T19:30:00Z',
  },
  {
    id: 'announcement-002',
    clubId: 'club-001',
    title: 'Workshop room update',
    body: 'React workshop moved to IRB 2207 this week because of the engineering career fair setup.',
    authorName: 'Jordan Kim',
    createdAt: '2026-03-26T22:10:00Z',
  },
];
const initialPosts: ClubPost[] = [
  {
    id: 'club-post-001',
    clubId: 'club-001',
    body: 'Registration for our next web sprint opens tonight. Bring a project or find one there.',
    authorName: 'Alex Chen',
    createdAt: '2026-03-28T18:10:00Z',
  },
];

function getRoleLabel(role: MemberRole | null | undefined): string {
  if (!role) return 'Guest';
  if (role === 'president') return 'Owner';
  if (role === 'admin') return 'Admin';
  if (role === 'officer') return 'Co-admin';
  return 'Member';
}

function getRoleBadgeColor(role: MemberRole) {
  if (role === 'president') return colors.primary.main;
  if (role === 'admin') return colors.status.info;
  if (role === 'officer') return colors.status.success;
  return colors.gray[700];
}

function getRoleRank(role: MemberRole) {
  if (role === 'president') return 4;
  if (role === 'admin') return 3;
  if (role === 'officer') return 2;
  return 1;
}

function getInitialClubState(clubId: string) {
  return {
    members: mockClubMembers.filter((member) => member.club_id === clubId),
    requests: mockJoinRequests.filter((request) => request.club_id === clubId),
    media: mockClubMedia.filter((item) => item.club_id === clubId),
    announcements: initialAnnouncements.filter((announcement) => announcement.clubId === clubId),
    posts: initialPosts.filter((post) => post.clubId === clubId),
  };
}

export default function ClubDetailScreen({ navigation, route }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('About');
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [showMediaComposer, setShowMediaComposer] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [postBody, setPostBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [isJoined, setIsJoined] = useState(true);

  const club = useMemo(
    () => mockClubs.find((item) => item.id === route.params.clubId) ?? null,
    [route.params.clubId],
  );

  const [members, setMembers] = useState<ClubMemberWithUser[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [media, setMedia] = useState<ClubMedia[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [posts, setPosts] = useState<ClubPost[]>([]);

  useEffect(() => {
    if (!club) {
      return;
    }

    const initialState = getInitialClubState(club.id);
    setMembers(initialState.members);
    setRequests(initialState.requests);
    setMedia(initialState.media);
    setAnnouncements(initialState.announcements);
    setPosts(initialState.posts);
    setActiveTab('About');
    setShowAnnouncementComposer(false);
    setShowPostComposer(false);
    setShowMediaComposer(false);
    setAnnouncementTitle('');
    setAnnouncementBody('');
    setPostBody('');
    setMediaUrl('');
    setMediaCaption('');
    setIsJoined(true);
  }, [club]);

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

  const sortedMembers = [...members].sort((left, right) => {
    const roleDifference = getRoleRank(right.role) - getRoleRank(left.role);
    if (roleDifference !== 0) {
      return roleDifference;
    }

    return left.user.display_name.localeCompare(right.user.display_name);
  });
  const leader = sortedMembers.find((member) => member.role === 'president') ?? sortedMembers[0];
  const currentMembership = sortedMembers.find((member) => member.user_id === currentUser.id) ?? null;
  const currentRole = currentMembership?.role ?? null;
  const canManageMembers = currentRole === 'admin' || currentRole === 'president';
  const canPublish = currentRole === 'officer' || currentRole === 'admin' || currentRole === 'president';
  const canTransferOwnership = currentRole === 'president';
  const initialApprovedCount = mockClubMembers.filter((member) => member.club_id === club.id).length;
  const memberCount = Math.max(club.member_count + (members.length - initialApprovedCount), members.length);
  const events = mockClubEvents.filter((event) => event.club_id === club.id);

  const resetComposers = () => {
    setShowAnnouncementComposer(false);
    setShowPostComposer(false);
    setShowMediaComposer(false);
    setAnnouncementTitle('');
    setAnnouncementBody('');
    setPostBody('');
    setMediaUrl('');
    setMediaCaption('');
  };

  const toggleComposer = (composer: 'announcement' | 'post' | 'media') => {
    setShowAnnouncementComposer(composer === 'announcement' ? !showAnnouncementComposer : false);
    setShowPostComposer(composer === 'post' ? !showPostComposer : false);
    setShowMediaComposer(composer === 'media' ? !showMediaComposer : false);
  };

  const publishAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      return;
    }

    setAnnouncements((current) => [
      {
        id: `announcement-${Date.now()}`,
        clubId: club.id,
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
        authorName: currentUser.display_name,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setAnnouncementTitle('');
    setAnnouncementBody('');
    setShowAnnouncementComposer(false);
  };

  const publishPost = () => {
    if (!postBody.trim()) {
      return;
    }

    setPosts((current) => [
      {
        id: `club-post-${Date.now()}`,
        clubId: club.id,
        body: postBody.trim(),
        authorName: currentUser.display_name,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setPostBody('');
    setShowPostComposer(false);
  };

  const addMedia = () => {
    if (!mediaUrl.trim() || !mediaCaption.trim()) {
      return;
    }

    setMedia((current) => [
      {
        id: `media-${Date.now()}`,
        club_id: club.id,
        url: mediaUrl.trim(),
        type: 'photo',
        caption: mediaCaption.trim(),
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
    setMediaUrl('');
    setMediaCaption('');
    setShowMediaComposer(false);
  };

  const approveRequest = (request: JoinRequest) => {
    setRequests((current) => current.filter((item) => item.id !== request.id));
    setMembers((current) => [
      ...current,
      {
        club_id: club.id,
        user_id: request.user.id,
        role: MemberRole.Member,
        status: MemberStatus.Approved,
        joined_at: new Date().toISOString(),
        user: request.user,
      },
    ]);
  };

  const rejectRequest = (requestId: string) => {
    setRequests((current) => current.filter((item) => item.id !== requestId));
  };

  const updateMemberRole = (userId: string, nextRole: MemberRole) => {
    setMembers((current) =>
      current.map((member) =>
        member.user_id === userId ? { ...member, role: nextRole } : member,
      ),
    );
  };

  const makeOwner = (userId: string) => {
    setMembers((current) =>
      current.map((member) => {
        if (member.user_id === userId) {
          return { ...member, role: MemberRole.President };
        }

        if (member.role === 'president') {
          return { ...member, role: MemberRole.Admin };
        }

        return member;
      }),
    );
  };

  const removeMember = (userId: string) => {
    setMembers((current) => current.filter((member) => member.user_id !== userId));
  };

  const renderMemberActions = (member: ClubMemberWithUser) => {
    if (!canManageMembers || member.user_id === currentUser.id || member.role === 'president') {
      return null;
    }

    return (
      <View style={styles.memberActions}>
        {currentRole === 'president' ? (
          <>
            {member.role !== 'member' ? (
              <Pressable style={styles.memberActionChip} onPress={() => updateMemberRole(member.user_id, MemberRole.Member)}>
                <Text style={styles.memberActionText}>Make Member</Text>
              </Pressable>
            ) : null}
            {member.role !== 'officer' ? (
              <Pressable style={styles.memberActionChip} onPress={() => updateMemberRole(member.user_id, MemberRole.Officer)}>
                <Text style={styles.memberActionText}>Make Co-admin</Text>
              </Pressable>
            ) : null}
            {member.role !== 'admin' ? (
              <Pressable style={styles.memberActionChip} onPress={() => updateMemberRole(member.user_id, MemberRole.Admin)}>
                <Text style={styles.memberActionText}>Make Admin</Text>
              </Pressable>
            ) : null}
            {canTransferOwnership ? (
              <Pressable style={[styles.memberActionChip, styles.memberActionChipAccent]} onPress={() => makeOwner(member.user_id)}>
                <Text style={[styles.memberActionText, styles.memberActionTextAccent]}>Make Owner</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {currentRole === 'admin' ? (
          <>
            {member.role !== 'member' ? (
              <Pressable style={styles.memberActionChip} onPress={() => updateMemberRole(member.user_id, MemberRole.Member)}>
                <Text style={styles.memberActionText}>Make Member</Text>
              </Pressable>
            ) : null}
            {member.role !== 'officer' ? (
              <Pressable style={styles.memberActionChip} onPress={() => updateMemberRole(member.user_id, MemberRole.Officer)}>
                <Text style={styles.memberActionText}>Make Co-admin</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        <Pressable style={[styles.memberActionChip, styles.memberActionChipDanger]} onPress={() => removeMember(member.user_id)}>
          <Text style={[styles.memberActionText, styles.memberActionTextDanger]}>Remove</Text>
        </Pressable>
      </View>
    );
  };

  return (
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
              <Badge
                label={club.category}
                color={colors.clubCategory[club.category as keyof typeof colors.clubCategory] ?? colors.primary.main}
              />
              <Badge label={`${memberCount} members`} color={colors.gray[700]} variant="outlined" />
            </View>
          </View>
        </View>

        <Text style={styles.description}>{club.short_description}</Text>

        <View style={styles.accessCard}>
          <View>
            <Text style={styles.accessLabel}>Your access</Text>
            <Text style={styles.accessValue}>{getRoleLabel(currentRole)}</Text>
          </View>
          <Badge
            label={canManageMembers ? 'Admin tools' : currentRole ? 'Member' : 'Guest'}
            color={canManageMembers ? colors.status.info : currentRole ? colors.status.success : colors.gray[600]}
          />
        </View>

        <View style={styles.actionButtons}>
          <Button title={isJoined ? 'Joined' : 'Join Club'} onPress={() => setIsJoined((value) => !value)} fullWidth />
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

      {canPublish ? (
        <Card style={styles.adminCard}>
          <Text style={styles.sectionTitle}>Admin studio</Text>
          <Text style={styles.bodyText}>Post updates, make announcements, and keep the gallery fresh.</Text>
          <View style={styles.adminActionRow}>
            <Button title="Post" size="sm" onPress={() => toggleComposer('post')} />
            <Button title="Announcement" size="sm" variant="secondary" onPress={() => toggleComposer('announcement')} />
            <Button title="Media" size="sm" variant="ghost" onPress={() => toggleComposer('media')} />
          </View>

          {showPostComposer ? (
            <View style={styles.composerCard}>
              <Input label="Post to feed" value={postBody} onChangeText={setPostBody} placeholder="Share an update with campus." multiline maxLength={280} />
              <View style={styles.inlineButtonRow}>
                <Button title="Publish" size="sm" onPress={publishPost} disabled={!postBody.trim()} />
                <Button title="Cancel" size="sm" variant="secondary" onPress={resetComposers} />
              </View>
            </View>
          ) : null}

          {showAnnouncementComposer ? (
            <View style={styles.composerCard}>
              <Input label="Announcement title" value={announcementTitle} onChangeText={setAnnouncementTitle} placeholder="Room change for this week" maxLength={80} />
              <Input label="Message" value={announcementBody} onChangeText={setAnnouncementBody} placeholder="Tell members what changed." multiline maxLength={220} />
              <View style={styles.inlineButtonRow}>
                <Button title="Publish" size="sm" onPress={publishAnnouncement} disabled={!announcementTitle.trim() || !announcementBody.trim()} />
                <Button title="Cancel" size="sm" variant="secondary" onPress={resetComposers} />
              </View>
            </View>
          ) : null}

          {showMediaComposer ? (
            <View style={styles.composerCard}>
              <Input label="Image URL" value={mediaUrl} onChangeText={setMediaUrl} placeholder="https://..." />
              <Input label="Caption" value={mediaCaption} onChangeText={setMediaCaption} placeholder="Hack night prep before Bitcamp" maxLength={80} />
              <View style={styles.inlineButtonRow}>
                <Button title="Add" size="sm" onPress={addMedia} disabled={!mediaUrl.trim() || !mediaCaption.trim()} />
                <Button title="Cancel" size="sm" variant="secondary" onPress={resetComposers} />
              </View>
            </View>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.tabShell}>
        <ClubTabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabKey)} />
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
                <Text style={styles.sectionTitle}>Announcements</Text>
                {announcements.length > 0 ? (
                  <View style={styles.stack}>
                    {announcements.map((announcement) => (
                      <View key={announcement.id} style={styles.noticeCard}>
                        <View style={styles.noticeHeader}>
                          <Text style={styles.noticeTitle}>{announcement.title}</Text>
                          <Text style={styles.noticeMeta}>{format(new Date(announcement.createdAt), 'MMM d')}</Text>
                        </View>
                        <Text style={styles.noticeBody}>{announcement.body}</Text>
                        <Text style={styles.noticeMeta}>Posted by {announcement.authorName}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.bodyText}>No announcements yet.</Text>
                )}
              </Card>

              <Card>
                <Text style={styles.sectionTitle}>Recent posts</Text>
                {posts.length > 0 ? (
                  <View style={styles.stack}>
                    {posts.map((post) => (
                      <View key={post.id} style={styles.noticeCard}>
                        <View style={styles.noticeHeader}>
                          <Text style={styles.noticeTitle}>{post.authorName}</Text>
                          <Text style={styles.noticeMeta}>{format(new Date(post.createdAt), 'MMM d, h:mm a')}</Text>
                        </View>
                        <Text style={styles.noticeBody}>{post.body}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.bodyText}>No club feed posts yet.</Text>
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
            <View style={styles.mediaGrid}>
              {media.map((item) => (
                <View key={item.id} style={styles.mediaTile}>
                  <Image source={{ uri: item.url }} style={styles.mediaImage} />
                  <Text style={styles.mediaCaption} numberOfLines={2}>{item.caption}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {activeTab === 'Members' ? (
            <View style={styles.stack}>
              {sortedMembers.map((member) => (
                <Card key={member.user_id} style={styles.memberCard}>
                  <View style={styles.memberHeader}>
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
                    <View style={styles.memberBadgeGroup}>
                      <Badge label={getRoleLabel(member.role)} color={getRoleBadgeColor(member.role)} />
                      {member.user_id === currentUser.id ? <Badge label="You" color={colors.gray[700]} variant="outlined" /> : null}
                    </View>
                  </View>
                  {renderMemberActions(member)}
                </Card>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {canPublish ? (
        requests.length > 0 ? (
          <View style={styles.stack}>
            <Text style={styles.sectionTitle}>Pending Join Requests</Text>
            {requests.map((request) => (
              <JoinRequestCard
                key={request.id}
                user={request.user}
                requestedAt={request.requested_at}
                onApprove={() => approveRequest(request)}
                onReject={() => rejectRequest(request.id)}
              />
            ))}
          </View>
        ) : (
          <Card>
            <Text style={styles.sectionTitle}>Pending Join Requests</Text>
            <Text style={styles.bodyText}>No membership requests are waiting right now.</Text>
          </Card>
        )
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  coverImage: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  clubName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  accessCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  accessLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  accessValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  actionButtons: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  bodyText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  snapshotItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  snapshotValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  snapshotLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  adminCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.status.infoLight,
    backgroundColor: '#FBFDFF',
  },
  adminActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  composerCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  inlineButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tabShell: {
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  tabContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  infoCard: {
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  memberMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stack: {
    gap: spacing.md,
  },
  noticeCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    gap: spacing.sm,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  noticeTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  noticeBody: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  noticeMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  mediaTile: {
    width: '47%',
  },
  mediaImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
  },
  mediaCaption: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  memberCard: {
    gap: spacing.md,
  },
  memberHeader: {
    gap: spacing.sm,
  },
  memberBadgeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  memberActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  memberActionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
  },
  memberActionChipAccent: {
    borderColor: colors.status.info,
    backgroundColor: colors.status.infoLight,
  },
  memberActionChipDanger: {
    borderColor: colors.status.error,
    backgroundColor: colors.status.errorLight,
  },
  memberActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  memberActionTextAccent: {
    color: colors.status.info,
  },
  memberActionTextDanger: {
    color: colors.status.error,
  },
});
