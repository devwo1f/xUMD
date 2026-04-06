import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { SearchStackParamList } from '../../../navigation/types';
import FollowButton from '../../social/components/FollowButton';
import { useCampusSocialGraph } from '../../social/hooks/useCampusSocialGraph';
import {
  getBrowseCategoryQueries,
  getClubContextLabel,
  getEventContextLabel,
  getLocationContextLabel,
  getPeopleSubtitle,
  buildLocalSuggestedQueries,
} from '../utils/localSearch';
import type {
  AutocompleteSuggestion,
  ClubPreview,
  EventPreview,
  LocationPreview,
  SearchResponse,
  SearchResultTab,
  UserPreview,
} from '../types';
import { useRecentSearches } from '../hooks/useRecentSearches';
import {
  SEARCH_FEATURE_FLAGS,
  useAutocomplete,
  useDebouncedValue,
  useDiscoveryHub,
  useUnifiedSearch,
} from '../hooks/useSearchQueries';

const RESULT_TABS: Array<{ id: SearchResultTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'people', label: 'People' },
  { id: 'events', label: 'Events' },
  { id: 'clubs', label: 'Clubs' },
  { id: 'locations', label: 'Locations' },
];

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchHome'>;

function groupSuggestions(suggestions: AutocompleteSuggestion[]) {
  return [
    { title: 'Events', type: 'event' as const, items: suggestions.filter((item) => item.type === 'event') },
    { title: 'Clubs', type: 'club' as const, items: suggestions.filter((item) => item.type === 'club') },
    { title: 'People', type: 'person' as const, items: suggestions.filter((item) => item.type === 'person') },
    { title: 'Locations', type: 'location' as const, items: suggestions.filter((item) => item.type === 'location') },
  ].filter((section) => section.items.length > 0);
}

export default function SearchHomeScreen({ navigation }: Props) {
  const { isWide, isDesktop } = useResponsive();
  const searchContentWidthStyle = isDesktop
    ? styles.searchContentDesktop
    : isWide
      ? styles.searchContentWide
      : null;
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchResultTab>('all');
  const [followOverrides, setFollowOverrides] = useState<Record<string, boolean>>({});
  const debouncedQuery = useDebouncedValue(query, 300);
  const { recentSearches, hydrated, addSearch, removeSearch, clearAll } = useRecentSearches();
  const { data: discovery, isLoading: discoveryLoading } = useDiscoveryHub();
  const autocomplete = useAutocomplete(
    debouncedQuery,
    isFocused && debouncedQuery.trim().length >= 2 && debouncedQuery.trim() !== submittedQuery.trim(),
  );
  const resultsQuery = useUnifiedSearch(submittedQuery);
  const { toggleFollow, isFollowingUser } = useCampusSocialGraph();
  const setPendingMapFocus = useCrossTabNavStore((state) => state.setPendingMapFocus);

  const showAutocomplete =
    isFocused &&
    query.trim().length >= 2 &&
    query.trim() !== submittedQuery.trim() &&
    (autocomplete.data?.suggestions.length ?? 0) > 0;
  const showResults = submittedQuery.trim().length >= 2;
  const results = resultsQuery.data;
  const discoveryData = discovery;

  const filteredResults = useMemo(() => {
    if (!results) {
      return null;
    }

    if (activeTab === 'all') {
      return results;
    }

    return {
      ...results,
      results: {
        people: activeTab === 'people' ? results.results.people : [],
        events: activeTab === 'events' ? results.results.events : [],
        clubs: activeTab === 'clubs' ? results.results.clubs : [],
        locations: activeTab === 'locations' ? results.results.locations : [],
      },
    } satisfies SearchResponse;
  }, [activeTab, results]);

  const suggestionSections = useMemo(
    () => groupSuggestions(autocomplete.data?.suggestions ?? []),
    [autocomplete.data?.suggestions],
  );

  const isFollowingWithOverride = (userId: string) => {
    if (userId in followOverrides) {
      return followOverrides[userId];
    }

    return isFollowingUser(userId);
  };

  const handleToggleFollow = async (userId: string) => {
    const nextValue = !isFollowingWithOverride(userId);
    setFollowOverrides((current) => ({ ...current, [userId]: nextValue }));

    try {
      await toggleFollow(userId);
    } catch {
      setFollowOverrides((current) => ({ ...current, [userId]: !nextValue }));
    }
  };

  const goToMapTab = () => {
    navigation.getParent()?.navigate('Map' as never);
  };

  const handleSubmitSearch = async (nextQuery?: string) => {
    const target = (nextQuery ?? query).trim();
    if (target.length < 2) {
      setSubmittedQuery('');
      setActiveTab('all');
      return;
    }

    Keyboard.dismiss();
    setSubmittedQuery(target);
    setQuery(target);
    setActiveTab('all');
    await addSearch(target);
  };

  const openUserProfile = async (userId: string, sourceQuery?: string) => {
    if (sourceQuery) {
      await addSearch(sourceQuery, 'person', userId);
    }
    navigation.navigate('UserProfile', { userId });
  };

  const openEventDetail = async (eventId: string, sourceQuery?: string) => {
    if (sourceQuery) {
      await addSearch(sourceQuery, 'event', eventId);
    }
    navigation.navigate('EventDetail', { eventId });
  };

  const openClubDetail = async (clubId: string, sourceQuery?: string) => {
    if (sourceQuery) {
      await addSearch(sourceQuery, 'club', clubId);
    }
    navigation.navigate('ClubDetail', { clubId });
  };

  const openEventOnMap = async (event: EventPreview, sourceQuery?: string) => {
    if (sourceQuery) {
      await addSearch(sourceQuery, 'event', event.id);
    }

    if (event.latitude !== null && event.longitude !== null) {
      setPendingMapFocus({
        type: 'event',
        eventId: event.id,
        latitude: event.latitude,
        longitude: event.longitude,
      });
      goToMapTab();
    }
  };

  const openLocationOnMap = async (location: LocationPreview, sourceQuery?: string) => {
    if (sourceQuery) {
      await addSearch(sourceQuery, 'location', location.id);
    }

    setPendingMapFocus({
      type: 'location',
      locationId: location.id,
      label: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    goToMapTab();
  };

  const handleSuggestionPress = (suggestion: AutocompleteSuggestion) => {
    switch (suggestion.type) {
      case 'person':
        void openUserProfile(suggestion.id, query);
        break;
      case 'event':
        void openEventDetail(suggestion.id, query);
        break;
      case 'club':
        void openClubDetail(suggestion.id, query);
        break;
      case 'location':
        if (typeof suggestion.latitude === 'number' && typeof suggestion.longitude === 'number') {
          void openLocationOnMap(
            {
              id: suggestion.id,
              name: suggestion.title,
              short_name: suggestion.subtitle.split(' · ')[0] ?? suggestion.title,
              building_type: suggestion.subtitle.split(' · ')[1] ?? 'location',
              active_event_count: 0,
              latitude: suggestion.latitude,
              longitude: suggestion.longitude,
            },
            query,
          );
        }
        break;
      default:
        break;
    }

    setIsFocused(false);
  };
  const renderPeopleCard = (user: UserPreview, sourceQuery: string) => (
    <Card key={user.id} style={[styles.resultCard, isWide && styles.resultCardWide]}>
      <Pressable onPress={() => void openUserProfile(user.id, sourceQuery)} style={styles.resultHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={18} color={colors.primary.main} />
        </View>
        <View style={styles.resultCopy}>
          <Text style={styles.resultTitle}>{user.display_name}</Text>
          <Text style={styles.resultSubtitle}>{getPeopleSubtitle(user)}</Text>
        </View>
      </Pressable>
      {user.bio ? <Text style={styles.resultBody}>{user.bio}</Text> : null}
      <View style={styles.resultFooterRow}>
        {user.major ? <Text style={styles.resultMetaText}>{user.major}</Text> : <View />}
        <FollowButton
          compact
          isFollowing={isFollowingWithOverride(user.id)}
          onPress={() => void handleToggleFollow(user.id)}
        />
      </View>
    </Card>
  );

  const renderEventCard = (event: EventPreview, sourceQuery: string) => (
    <Card key={event.id} style={[styles.resultCard, isWide && styles.resultCardWide]}>
      <Pressable onPress={() => void openEventDetail(event.id, sourceQuery)} style={styles.resultCopy}>
        <View style={styles.metaChipRow}>
          <View style={styles.eventCategoryChip}>
            <Text style={styles.eventCategoryLabel}>{event.category}</Text>
          </View>
          {event.status === 'live' ? (
            <View style={styles.liveMiniPill}>
              <View style={styles.liveMiniDot} />
              <Text style={styles.liveMiniLabel}>Live</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.resultTitle}>{event.title}</Text>
        <Text style={styles.resultSubtitle}>{getEventContextLabel(event)}</Text>
        <Text style={styles.resultMetaText}>
          {event.attendee_count} going
          {event.friends_going_count > 0 ? ` · ${event.friends_going_count} friends` : ''}
        </Text>
      </Pressable>
      <View style={styles.actionRow}>
        <Pressable onPress={() => void openEventDetail(event.id, sourceQuery)} style={styles.secondaryActionButton}>
          <Text style={styles.secondaryActionLabel}>View Details</Text>
        </Pressable>
        <Pressable onPress={() => void openEventOnMap(event, sourceQuery)} style={styles.primaryActionButton}>
          <Ionicons name="map-outline" size={16} color={colors.brand.white} />
          <Text style={styles.primaryActionLabel}>Show on Map</Text>
        </Pressable>
      </View>
    </Card>
  );

  const renderClubCard = (club: ClubPreview, sourceQuery: string) => (
    <Card key={club.id} style={[styles.resultCard, isWide && styles.resultCardWide]}>
      <Pressable onPress={() => void openClubDetail(club.id, sourceQuery)} style={styles.resultCopy}>
        <Text style={styles.resultTitle}>{club.name}</Text>
        <Text style={styles.resultSubtitle}>{getClubContextLabel(club)}</Text>
        <Text style={styles.resultBody}>{club.description}</Text>
      </Pressable>
      <View style={styles.tagWrap}>
        {club.tags.slice(0, 4).map((tag) => (
          <View key={`${club.id}-${tag}`} style={styles.softTag}>
            <Text style={styles.softTagLabel}>{tag}</Text>
          </View>
        ))}
      </View>
    </Card>
  );

  const renderLocationCard = (location: LocationPreview, sourceQuery: string) => (
    <Card key={location.id} style={[styles.resultCard, isWide && styles.resultCardWide]}>
      <Pressable onPress={() => void openLocationOnMap(location, sourceQuery)} style={styles.resultCopy}>
        <Text style={styles.resultTitle}>{location.name}</Text>
        <Text style={styles.resultSubtitle}>{getLocationContextLabel(location)}</Text>
      </Pressable>
      <View style={styles.actionRow}>
        <Pressable onPress={() => void openLocationOnMap(location, sourceQuery)} style={styles.primaryActionButton}>
          <Ionicons name="navigate-outline" size={16} color={colors.brand.white} />
          <Text style={styles.primaryActionLabel}>Show on Map</Text>
        </Pressable>
      </View>
    </Card>
  );

  const renderResultsGroup = (title: string, count: number, items: React.ReactNode[]) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <View style={styles.groupSection}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{title}</Text>
          <Text style={styles.groupCount}>{count}</Text>
        </View>
        <View style={[styles.groupList, isWide && styles.groupListWide]}>{items}</View>
      </View>
    );
  };

  const renderFullResults = () => {
    if (resultsQuery.isLoading && !filteredResults) {
      return (
        <View style={styles.groupList}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`search-skeleton-${index}`} style={styles.resultCard}>
              <View style={styles.skeletonLineWide} />
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
            </Card>
          ))}
        </View>
      );
    }

    if (!filteredResults) {
      return null;
    }

    const noResults =
      filteredResults.results.people.length === 0 &&
      filteredResults.results.events.length === 0 &&
      filteredResults.results.clubs.length === 0 &&
      filteredResults.results.locations.length === 0;

    if (noResults) {
      const suggestions = buildLocalSuggestedQueries(submittedQuery);
      return (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No results for "{submittedQuery}"</Text>
          <Text style={styles.emptyBody}>
            Try a different search, or jump into one of these nearby ideas.
          </Text>
          <View style={styles.suggestedQueryRow}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => void handleSubmitSearch(suggestion)}
                style={styles.suggestedQueryChip}
              >
                <Text style={styles.suggestedQueryLabel}>{suggestion}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      );
    }

    return (
      <View style={styles.resultsShell}>
        <Card style={styles.resultsMetaCard}>
          <Text style={styles.resultsMetaTitle}>
            {filteredResults.extracted_filters?.clean_query &&
            filteredResults.extracted_filters.clean_query !== submittedQuery
              ? `Showing results for "${filteredResults.extracted_filters.clean_query}"`
              : `Results for "${submittedQuery}"`}
          </Text>
          <Text style={styles.resultsMetaBody}>
            {filteredResults.intent === 'semantic'
              ? 'Intent search is helping connect your query to campus activities and people.'
              : filteredResults.intent === 'hybrid'
                ? 'Blending exact matches with intent-based discovery.'
                : 'Showing the strongest direct matches first.'}
          </Text>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {RESULT_TABS.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.resultsTab, selected && styles.resultsTabActive]}
              >
                <Text style={[styles.resultsTabLabel, selected && styles.resultsTabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {renderResultsGroup(
          'Events',
          filteredResults.total_counts.events,
          filteredResults.results.events.map((entry) => renderEventCard(entry.data, submittedQuery)),
        )}
        {renderResultsGroup(
          'Clubs',
          filteredResults.total_counts.clubs,
          filteredResults.results.clubs.map((entry) => renderClubCard(entry.data, submittedQuery)),
        )}
        {renderResultsGroup(
          'People',
          filteredResults.total_counts.people,
          filteredResults.results.people.map((entry) => renderPeopleCard(entry.data, submittedQuery)),
        )}
        {renderResultsGroup(
          'Locations',
          filteredResults.total_counts.locations,
          filteredResults.results.locations.map((entry) => renderLocationCard(entry.data, submittedQuery)),
        )}
      </View>
    );
  };
  const renderDiscovery = () => (
    <View style={[styles.discoveryShell, isWide && styles.discoveryShellWide]}>
      {discoveryLoading && !discoveryData ? (
        <Card style={styles.resultCard}>
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLine} />
        </Card>
      ) : null}

      {discoveryData ? (
        <>
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Trending on Campus</Text>
              <Text style={styles.sectionMeta}>Fresh now</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
              {discoveryData.trending_events.map((event) => (
                <Card
                  key={event.id}
                  onPress={() => void openEventDetail(event.id, event.title)}
                  style={[styles.discoveryEventCard, isWide && styles.discoveryEventCardWide]}
                >
                  <View style={styles.discoveryBadgeWrap}>
                    {event.badge ? (
                      <View style={styles.discoveryBadge}>
                        <Text style={styles.discoveryBadgeLabel}>{event.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.discoveryCardTitle}>{event.title}</Text>
                  <Text style={styles.discoveryCardMeta}>{getEventContextLabel(event)}</Text>
                  <Text style={styles.discoveryCardMeta}>{event.attendee_count} going</Text>
                </Card>
              ))}
            </ScrollView>
          </View>

          {discoveryData.trending_hashtags.length > 0 ? (
            <Card style={styles.hashtagCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Trending hashtags</Text>
                <Text style={styles.sectionMeta}>Campus pulse</Text>
              </View>
              <View style={styles.trendingTagsWrap}>
                {discoveryData.trending_hashtags.slice(0, 8).map((item) => (
                  <Pressable
                    key={item.hashtag}
                    onPress={() => void handleSubmitSearch(`#${item.hashtag}`)}
                    style={styles.hashtagChip}
                  >
                    <Text style={styles.hashtagChipLabel}>#{item.hashtag}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Happening Now</Text>
              <Text style={styles.sectionMeta}>Live around campus</Text>
            </View>
            <View style={styles.groupList}>
              {discoveryData.live_events.length > 0 ? (
                discoveryData.live_events.map((event) => renderEventCard(event, event.title))
              ) : (
                <Card style={styles.resultCard}>
                  <Text style={styles.emptyBody}>
                    Nothing live at this second, but the next few hours still look packed.
                  </Text>
                </Card>
              )}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>People You May Know</Text>
              <Text style={styles.sectionMeta}>Built from your campus graph</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
              {discoveryData.people_you_may_know.map((entry) => (
                <Card
                  key={entry.data.id}
                  style={[styles.personDiscoveryCard, isDesktop && styles.personDiscoveryCardWide]}
                >
                  <Pressable
                    onPress={() => void openUserProfile(entry.data.id, entry.data.display_name)}
                    style={styles.personDiscoveryHeader}
                  >
                    <View style={styles.avatarPlaceholderLarge}>
                      <Ionicons name="person" size={22} color={colors.primary.main} />
                    </View>
                    <View style={styles.resultCopy}>
                      <Text style={styles.resultTitle}>{entry.data.display_name}</Text>
                      <Text style={styles.resultSubtitle}>{getPeopleSubtitle(entry.data)}</Text>
                    </View>
                  </Pressable>
                  <Text style={styles.resultBody}>{entry.match_reason}</Text>
                  <FollowButton
                    compact
                    isFollowing={isFollowingWithOverride(entry.data.id)}
                    onPress={() => void handleToggleFollow(entry.data.id)}
                  />
                </Card>
              ))}
            </ScrollView>
          </View>
        </>
      ) : null}

      <View style={[styles.utilityGrid, isWide && styles.utilityGridWide]}>
        <Card style={[styles.categoryCard, isWide && styles.utilityCardWide]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <Text style={styles.sectionMeta}>Quick discovery</Text>
          </View>
          <View style={styles.categoryGrid}>
            {getBrowseCategoryQueries().map((entry) => (
              <Pressable
                key={entry.label}
                onPress={() => void handleSubmitSearch(entry.label)}
                style={styles.categoryChip}
              >
                <Text style={styles.categoryChipLabel}>{entry.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={[styles.recentCard, isWide && styles.utilityCardWide]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {recentSearches.length > 0 ? (
              <Pressable onPress={() => void clearAll()}>
                <Text style={styles.clearLabel}>Clear All</Text>
              </Pressable>
            ) : null}
          </View>
          {hydrated && recentSearches.length > 0 ? (
            <View style={styles.recentList}>
              {recentSearches.map((entry) => (
                <View key={`${entry.query}-${entry.timestamp}`} style={styles.recentRow}>
                  <Pressable onPress={() => void handleSubmitSearch(entry.query)} style={styles.recentPrimaryAction}>
                    <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                    <Text style={styles.recentQueryLabel}>{entry.query}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void removeSearch(entry.query)}
                    accessibilityLabel={`Remove ${entry.query} from recent searches`}
                  >
                    <Ionicons name="close" size={18} color={colors.text.tertiary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyBody}>
              Recent searches will stay on this device so it is quick to jump back into what you were exploring.
            </Text>
          )}
        </Card>
      </View>
    </View>
  );

  return (
    <ScreenLayout
      title="Search"
      subtitle="People, events, clubs, and places in one campus brain."
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="search-outline"
          label="Unified Search"
          color={colors.primary.main}
          tintColor={colors.primary.lightest}
        />
      }
      headerStyle={styles.headerShell}
      scroll={false}
      contentContainerStyle={styles.screenBody}
    >
      <View style={styles.searchShell}>
        <View style={[styles.searchShellInner, searchContentWidthStyle]}>
          <View style={styles.searchBarCard}>
            <Ionicons name="search" size={20} color={colors.text.secondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsFocused(false), 120);
              }}
              onSubmitEditing={() => {
                setIsFocused(false);
                void handleSubmitSearch();
              }}
              placeholder="Search people, events, clubs, places..."
              placeholderTextColor={colors.text.tertiary}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.searchInput,
                Platform.OS === 'web'
                  ? ({ outlineWidth: 0, outlineStyle: 'none', borderWidth: 0, boxShadow: 'none' } as any)
                  : null,
              ]}
              accessibilityLabel="Search xUMD"
              accessibilityHint="Search across people, events, clubs, and campus locations"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery('');
                  setSubmittedQuery('');
                  setActiveTab('all');
                }}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
              </Pressable>
            ) : SEARCH_FEATURE_FLAGS.voiceSearch ? (
              <Pressable accessibilityLabel="Voice search" style={styles.controlButton}>
                <Ionicons name="mic-outline" size={18} color={colors.text.secondary} />
              </Pressable>
            ) : null}
          </View>

          {showAutocomplete ? (
            <Card style={styles.autocompleteDropdown}>
              {suggestionSections.map((section) => (
                <View key={section.type} style={styles.autocompleteSection}>
                  <Text style={styles.autocompleteTitle}>{section.title}</Text>
                  {section.items.map((item) => (
                    <Pressable
                      key={`${item.type}-${item.id}`}
                      onPress={() => handleSuggestionPress(item)}
                      style={styles.autocompleteRow}
                    >
                      <View style={styles.autocompleteIconWrap}>
                        <Ionicons
                          name={item.icon as keyof typeof Ionicons.glyphMap}
                          size={16}
                          color={colors.primary.main}
                        />
                      </View>
                      <View style={styles.resultCopy}>
                        <Text style={styles.autocompleteRowTitle}>{item.title}</Text>
                        <Text style={styles.autocompleteRowSubtitle}>{item.subtitle}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))}
              <Pressable onPress={() => void handleSubmitSearch(query)} style={styles.fullResultsRow}>
                <Text style={styles.fullResultsLabel}>Press Enter for full results</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary.main} />
              </Pressable>
            </Card>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.flexFill}
        contentContainerStyle={[styles.scrollContent, searchContentWidthStyle]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {showResults ? renderFullResults() : renderDiscovery()}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary.lightest,
    backgroundColor: '#FFFDFD',
  },
  screenBody: {
    flex: 1,
    gap: spacing.md,
  },
  flexFill: {
    flex: 1,
  },
  searchShell: {
    position: 'relative',
    zIndex: 4,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchShellInner: {
    width: '100%',
    alignSelf: 'center',
  },
  searchContentWide: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  searchContentDesktop: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  searchBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    ...shadows.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  controlButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  autocompleteDropdown: {
    position: 'absolute',
    top: 64,
    left: spacing.md,
    right: spacing.md,
    zIndex: 5,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.lg,
  },
  autocompleteSection: {
    gap: spacing.xs,
  },
  autocompleteTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  autocompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  autocompleteIconWrap: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  autocompleteRowTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  autocompleteRowSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  fullResultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  fullResultsLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  discoveryShell: {
    gap: spacing.lg,
  },
  discoveryShellWide: {
    gap: spacing.xl,
  },
  resultsShell: {
    gap: spacing.lg,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  horizontalRow: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  discoveryEventCard: {
    width: 240,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  discoveryEventCardWide: {
    width: 280,
  },
  discoveryBadgeWrap: {
    minHeight: 24,
  },
  discoveryBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  discoveryBadgeLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  discoveryCardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  discoveryCardMeta: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  hashtagCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  trendingTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hashtagChip: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hashtagChipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  personDiscoveryCard: {
    width: 240,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  personDiscoveryCardWide: {
    width: 280,
  },
  personDiscoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  avatarPlaceholderLarge: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  utilityGrid: {
    gap: spacing.lg,
  },
  utilityGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  utilityCardWide: {
    flex: 1,
  },
  categoryCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  recentCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  clearLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  recentList: {
    gap: spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recentPrimaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recentQueryLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  resultsMetaCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary.lightest,
    backgroundColor: '#FFF8FA',
  },
  resultsMetaTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  resultsMetaBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  tabsRow: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  resultsTab: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultsTabActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest,
  },
  resultsTabLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  resultsTabLabelActive: {
    color: colors.primary.main,
  },
  groupSection: {
    gap: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  groupTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  groupCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  groupList: {
    gap: spacing.md,
  },
  groupListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  resultCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  resultCardWide: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 320,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultCopy: {
    gap: spacing.xs,
  },
  resultTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  resultSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  resultBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.text.secondary,
  },
  resultFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  resultMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  metaChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  eventCategoryChip: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  eventCategoryLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  liveMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  liveMiniDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
  },
  liveMiniLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryActionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.brand.white,
  },
  secondaryActionButton: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryActionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  softTag: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  softTagLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  emptyCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  suggestedQueryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestedQueryChip: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestedQueryLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  skeletonLineWide: {
    width: '68%',
    height: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.light,
  },
  skeletonLine: {
    width: '100%',
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.light,
  },
  skeletonLineShort: {
    width: '60%',
  },
});
