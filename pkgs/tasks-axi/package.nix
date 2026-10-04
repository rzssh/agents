{ callPackage }:

callPackage ../axi/package.nix rec {
  pname = "tasks-axi";
  version = "0.2.6";
  tag = "${pname}-v${version}";
  hash = "sha256-nf6KkZEoJ+BD7PeGat/GVk8FQbuAJ0AHR5XuX+bwlZo=";
  pnpmHash = "sha256-vZcUSa35SvRJoaeuSUuDpv54FJRtP1fxv+6+tR9euR0=";
}
