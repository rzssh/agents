{
  description = "Personal AI agent runtime";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    crit = {
      url = "github:tomasz-tomczyk/crit/v0.18.1";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    herdr = {
      url = "github:ogulcancelik/herdr/v0.7.5";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    hermes-agent.url = "github:NousResearch/hermes-agent";

    openspec = {
      url = "github:Fission-AI/OpenSpec";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    pi-coding-agent-src = {
      url = "https://registry.npmjs.org/@earendil-works/pi-coding-agent/-/pi-coding-agent-0.84.1.tgz";
      flake = false;
    };

    treehouse = {
      url = "github:kunchenguid/treehouse/v2.0.1";
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
            ruff check bin/ai-run bin/ai-workspace-picker
            shellcheck bin/ai-workspace bin/firstmate bin/update-pi
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
