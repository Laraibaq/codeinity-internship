import React from "react";
import { icons as LucideIcons } from "lucide-react-native";
import type { ColorValue } from "react-native";

/**
 * Material Symbols → lucide-react-native mapping.
 *
 * The original web UI used Google's Material Symbols Outlined font.
 * On React Native we swap to lucide, which ships as SVG and works on
 * every platform (iOS, Android, web).
 *
 * If a symbol you need isn't mapped yet, add it here and it becomes
 * available everywhere via <Icon name="..." />.
 */
export const ICON_MAP = {
  favorite: "Heart",
  heart: "Heart",
  arrow_back: "ArrowLeft",
  arrow_forward: "ArrowRight",
  arrow_drop_down: "ChevronDown",
  expand_more: "ChevronDown",
  expand_less: "ChevronUp",
  chevron_left: "ChevronLeft",
  chevron_right: "ChevronRight",
  check: "Check",
  check_circle: "CircleCheck",
  close: "X",
  error: "CircleAlert",
  info: "Info",
  lock: "Lock",
  verified: "BadgeCheck",
  shield_person: "ShieldCheck",
  smartphone: "Smartphone",
  aspect_ratio: "Maximize2",
  person: "User",
  face: "User",
  face_3: "UserRound",
  face_6: "User",
  face_4: "UserRound",
  male: "User",
  female: "User",
  school: "GraduationCap",
  work: "Briefcase",
  location_on: "MapPin",
  home: "House",
  family_restroom: "Users",
  cake: "Cake",
  height: "Ruler",
  photo_camera: "Camera",
  add_a_photo: "Camera",
  add: "Plus",
  edit: "Pencil",
  delete: "Trash2",
  search: "Search",
  star: "Star",
  bolt: "Zap",
  diamond: "Gem",
  workspace_premium: "Award",
  handshake: "Handshake",
  celebration: "PartyPopper",
  auto_awesome: "Sparkles",
  visibility: "Eye",
  visibility_off: "EyeOff",
  more_vert: "EllipsisVertical",
  menu: "Menu",
  settings: "Settings",
  language: "Globe",
  restaurant: "Utensils",
  local_bar: "Wine",
  smoking_rooms: "Cigarette",
  flight_takeoff: "Plane",
  child_care: "Baby",
  attach_money: "DollarSign",
  payments: "CreditCard",
  camera_alt: "Camera",
  photo_library: "Images",
  upload: "Upload",
  cloud_upload: "CloudUpload",
  hourglass_empty: "Hourglass",
  timer: "Timer",
  volunteer_activism: "HeartHandshake",
  psychology: "Brain",
  self_improvement: "Sparkle",
  fitness_center: "Dumbbell",
  local_cafe: "Coffee",
  book: "BookOpen",
  palette: "Palette",
  music_note: "Music",
  movie: "Film",
  sports_esports: "Gamepad2",
  hiking: "MountainSnow",
  pets: "PawPrint",
  notifications: "Bell",
  tune: "SlidersHorizontal",
  favorite_border: "Heart",
  report: "Flag",
  block: "Ban",
  filter_list: "ListFilter",
  share: "Share2",
  more_horiz: "Ellipsis",
  send: "Send",
  chat: "MessageCircle",
  inbox: "Inbox",
  person_search: "UserSearch",
  local_fire_department: "Flame",
  group: "Users",
  radio_button_unchecked: "Circle",
  fingerprint: "Fingerprint",
  remove: "Minus",
  mail: "Mail",
  building_2: "Building2",
  user_x: "UserX",
  help_circle: "CircleHelp",
  alert_triangle: "TriangleAlert",
  rocket: "Rocket",
  infinity: "Infinity",
  alert_octagon: "OctagonAlert",
  shopping_bag: "ShoppingBag",
  shield_alert: "ShieldAlert",
  history: "History",
  message_square: "MessageSquare",
  family_home: "House",
  person_add: "UserPlus",
  account_circle: "CircleUser",
  forum: "MessagesSquare",
  search_off: "SearchX",
  synagogue: "Landmark",
} as const satisfies Record<string, keyof typeof LucideIcons>;

export type IconName = keyof typeof ICON_MAP;

export interface IconProps {
  name: IconName | string;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
  fill?: boolean;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = "#1b1c1a",
  strokeWidth = 2,
  fill = false,
  className,
}) => {
  const lucideName = (ICON_MAP as Record<string, string>)[name] ?? "Circle";
  const LucideIcon =
    LucideIcons[lucideName as keyof typeof LucideIcons] ?? LucideIcons.Circle;
  return (
    <LucideIcon
      size={size}
      color={color as string}
      strokeWidth={strokeWidth}
      fill={fill ? (color as string) : "none"}
      className={className}
    />
  );
};
