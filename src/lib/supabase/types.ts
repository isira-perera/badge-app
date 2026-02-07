export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  is_admin: boolean
  created_at: string
}

export type Badge = {
  id: string
  name: string
  task: string
  image_url: string | null
  created_by: string
  created_at: string
}

export type UserBadge = {
  id: string
  user_id: string
  badge_id: string
  learning: string
  awarded_at: string
}

export type LeaderboardEntry = {
  id: string
  display_name: string
  avatar_url: string | null
  badge_count: number
}

export type ActivityFeedItem = {
  id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  badge_id: string
  badge_name: string
  badge_image_url: string | null
  learning: string
  awarded_at: string
}
