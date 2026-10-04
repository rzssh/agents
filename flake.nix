{
  description = "Personal AI agent runtime";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    herdr.url = "github:herdrdev/herdr/v0.9.3";

    hermes-agent.url = "github:NousResearch/hermes-agent";

    pi-coding-agent-src = {
      url = "https://registry.npmjs.org/@earendil-works/pi-coding-agent/-/pi-coding-agent-1.0.1.tgz";
      flake = false;
    };

    treehouse = {
      url = "github:kunchenguid/treehouse/v3.1.2";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    tuicr = {
      url = "github:agavra/tuicr/v0.27.0";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      ...
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      packages = import ./pkgs { inherit pkgs inputs; };
    in
    {
      checks.${system}.default =
        pkgs.runCommand "agents-check"
          {
            nativeBuildInputs = [
              pkgs.biome
              pkgs.nodejs_24
              pkgs.python3
              pkgs.ruff
              pkgs.shellcheck
              pkgs.tsx
            ];
          }
          ''
            cp -r ${self} source
            chmod -R u+w source
            cd source
            biome check agents/pi
            tsx --test agents/pi/lib/*.test.ts
            python3 bin/test_update_sources.py
            ruff check bin/ai-run bin/ai-workspace-picker bin/update-sources.py bin/test_update_sources.py
            shellcheck bin/ai-workspace bin/firstmate bin/update-pi bin/update
            touch "$out"
          '';

      devShells.${system}.default = pkgs.mkShell {
        packages = [
          pkgs.biome
          pkgs.nodejs_24
          pkgs.nixfmt-tree
          pkgs.ruff
          pkgs.shellcheck
          pkgs.tsx
        ];
      };

      formatter.${system} = pkgs.nixfmt-tree;

      homeManagerModules.default = import ./home/default.nix {
        inherit inputs;
      };

      packages.${system} = packages // {
        default = packages.pi-coding-agent;
      };
    };
}
