'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Heart, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DiscoveryCard {
  id: string;
  slug: string;
  name: string;
  headline: string;
  bio: string;
  avatar?: string;
  featuredPersonas: string[];
  topSkills: string[];
  viewCount: number;
  isLiked?: boolean;
}

interface Filters {
  expertise: string[];
  location?: string;
  availability?: string;
  sortBy: 'recent' | 'popular' | 'match';
}

export default function DiscoveryFeed() {
  const [profiles, setProfiles] = useState<DiscoveryCard[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<DiscoveryCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    expertise: [],
    sortBy: 'popular',
  });
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());

  const expertiseOptions = [
    'Software Engineering',
    'Product Management',
    'Design',
    'Data Science',
    'Leadership',
    'Entrepreneurship',
    'Finance',
    'Marketing',
  ];

  const loadProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/public-profiles');
      if (response.ok) {
        const data = (await response.json()) as { profiles: DiscoveryCard[] };
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const filterProfiles = useCallback(() => {
    let filtered = profiles;

    // Search
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.topSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    // Expertise filter
    if (filters.expertise.length > 0) {
      filtered = filtered.filter((p) =>
        p.topSkills.some((skill) => filters.expertise.some((f) => skill.includes(f))),
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => a.viewCount - b.viewCount);
        break;
      case 'popular':
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'match':
        // Would be based on current user's profile
        break;
    }

    setFilteredProfiles(filtered);
  }, [profiles, searchQuery, filters]);

  useEffect(() => {
    filterProfiles();
  }, [filterProfiles]);

  const handleExpertiseToggle = (expertise: string) => {
    setFilters((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter((e) => e !== expertise)
        : [...prev.expertise, expertise],
    }));
  };

  const handleLike = (profileId: string) => {
    setLikedProfiles((prev) => {
      const updated = new Set(prev);
      if (updated.has(profileId)) {
        updated.delete(profileId);
      } else {
        updated.add(profileId);
      }
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Discover Professionals</h1>

          {/* Search Bar */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, skill, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Expertise</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {expertiseOptions.map((expertise) => (
                    <label key={expertise} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.expertise.includes(expertise)}
                        onChange={() => handleExpertiseToggle(expertise)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{expertise}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
                <div className="flex gap-3">
                  {(['recent', 'popular', 'match'] as const).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setFilters((prev) => ({ ...prev, sortBy: sort }))}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.sortBy === sort
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {(filters.expertise.length > 0 || filters.sortBy !== 'popular') && (
                <button
                  onClick={() => {
                    setFilters({ expertise: [], sortBy: 'popular' });
                    setSearchQuery('');
                  }}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-gray-600">Loading profiles...</p>
            </div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ExternalLink className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No profiles match your criteria</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.slug}`}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {profile.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{profile.headline}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLike(profile.id);
                      }}
                      className={`ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                        likedProfiles.has(profile.id)
                          ? 'bg-red-100 text-red-600'
                          : 'hover:bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${likedProfiles.has(profile.id) ? 'fill-current' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">{profile.bio}</p>

                  {/* Featured Personas */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Personas</div>
                    <div className="flex flex-wrap gap-1">
                      {profile.featuredPersonas.slice(0, 3).map((persona) => (
                        <span
                          key={persona}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {persona}
                        </span>
                      ))}
                      {profile.featuredPersonas.length > 3 && (
                        <span className="px-2 py-1 text-gray-600 text-xs">
                          +{profile.featuredPersonas.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Top Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {profile.topSkills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ExternalLink className="w-4 h-4" />
                      <span>{profile.viewCount} views</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Send message"
                    >
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info Card */}
        {filteredProfiles.length > 0 && (
          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Discover Network</h3>
            <p className="text-sm text-blue-800">
              Find professionals in your field, explore different personas, and build meaningful
              connections. All profiles shown here have chosen to be publicly discoverable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
