import React from "react";
import Svg, { Rect, SvgProps } from "react-native-svg";

/**
 * StackIcon - A stack of cards icon for the discard pile
 * Converted from assets/images/stack-icon.svg for cross-platform compatibility
 */
interface StackIconProps extends Omit<SvgProps, "width" | "height"> {
  width?: number;
  height?: number;
  color?: string;
}

export const StackIcon: React.FC<StackIconProps> = ({
  width = 28,
  height = 40,
  color = "#A73349",
  ...props
}) => {
  // Original viewBox: 0 0 77 110
  // Scale factor based on original dimensions
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 77 110"
      fill="none"
      {...props}
    >
      {/* Back card (outline only) */}
      <Rect
        x={3}
        y={3}
        width={51}
        height={84}
        rx={7}
        stroke={color}
        strokeWidth={6}
      />
      {/* Middle card */}
      <Rect
        x={13}
        y={13}
        width={51}
        height={84}
        rx={7}
        fill="#CC3F5A"
        stroke={color}
        strokeWidth={6}
      />
      {/* Front card */}
      <Rect
        x={23}
        y={23}
        width={51}
        height={84}
        rx={7}
        fill="#CC3F5A"
        stroke={color}
        strokeWidth={6}
      />
    </Svg>
  );
};

export default StackIcon;

