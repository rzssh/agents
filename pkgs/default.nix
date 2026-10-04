{ pkgs, inputs }:

let
  hermes = pkgs.callPackage "${inputs.hermes-agent}/nix/hermes-agent.nix" {
    inherit (inputs.hermes-agent.inputs) uv2nix pyproject-nix pyproject-build-systems;
    npm-lockfile-fix =
      inputs.hermes-agent.inputs.npm-lockfile-fix.packages.${pkgs.stdenv.hostPlatform.system}.default;
    rev = inputs.hermes-agent.rev or null;
  };
in
{
  chrome-devtools-axi = pkgs.callPackage ./chrome-devtools-axi/package.nix { };
  chrome-devtools-mcp = pkgs.callPackage ./chrome-devtools-mcp/package.nix { };
  gh-axi = pkgs.callPackage ./gh-axi/package.nix { };
  herdr = inputs.herdr.packages.${pkgs.stdenv.hostPlatform.system}.default;
  inherit hermes;
  lavish-axi = pkgs.callPackage ./lavish-axi/package.nix { };
  no-mistakes = pkgs.callPackage ./no-mistakes/package.nix { };
  pi-coding-agent = pkgs.callPackage ./pi-coding-agent/package.nix {
    src = inputs.pi-coding-agent-src;
  };
  quota-axi = pkgs.callPackage ./quota-axi/package.nix { };
  tasks-axi = pkgs.callPackage ./tasks-axi/package.nix { };
  treehouse = inputs.treehouse.packages.${pkgs.stdenv.hostPlatform.system}.default;
  tuicr = inputs.tuicr.packages.${pkgs.stdenv.hostPlatform.system}.default;
}
