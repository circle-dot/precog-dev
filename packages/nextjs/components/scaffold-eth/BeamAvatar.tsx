"use client";

import Avatar from "boring-avatars";

interface BeamAvatarProps {
  address: string;
  size?: number;
}

export const BeamAvatar = ({ address, size = 30 }: BeamAvatarProps) => (
  <Avatar
    size={size}
    name={address}
    variant="beam"
    colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
  />
);
