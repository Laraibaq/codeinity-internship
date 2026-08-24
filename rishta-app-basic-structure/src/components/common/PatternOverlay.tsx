import React from "react";
import { View } from "react-native";
import Svg, { Defs, Pattern, Path, Rect } from "react-native-svg";

/**
 * The girih-inspired background pattern used across onboarding screens.
 * Rendered as an inline SVG so it works identically on iOS, Android, and web.
 */
export const PatternOverlay: React.FC<{ className?: string; opacity?: number }> = ({
  className,
  opacity = 1,
}) => (
  <View
    pointerEvents="none"
    className={className ?? "absolute inset-0"}
    style={{ opacity }}
  >
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern
          id="girih"
          patternUnits="userSpaceOnUse"
          width={40}
          height={40}
          viewBox="0 0 40 40"
        >
          <Path
            d="M20 0l20 20-20 20L0 20z"
            stroke="rgba(6,78,59,0.04)"
            fill="none"
            strokeWidth={1}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#girih)" />
    </Svg>
  </View>
);
