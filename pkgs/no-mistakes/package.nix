{
  lib,
  buildGoModule,
  fetchFromGitHub,
}:

buildGoModule rec {
  pname = "no-mistakes";
  version = "1.40.0";

  src = fetchFromGitHub {
    owner = "kunchenguid";
    repo = "no-mistakes";
    tag = "v${version}";
    hash = "sha256-13ApAoPhwk5YlkJ+huT9VYpIpRW1rFHbfAkrPjfkevI=";
  };

  vendorHash = "sha256-NZOYxNYvt4192uqKBdKRxdgrKFvWx3585psdCnRdPSM=";
  subPackages = [ "cmd/no-mistakes" ];
  ldflags = [
    "-s"
    "-w"
    "-X github.com/kunchenguid/no-mistakes/internal/buildinfo.Version=v${version}"
  ];

  postInstall = ''
    mkdir -p $out/share/no-mistakes/skills
    cp -r skills/no-mistakes $out/share/no-mistakes/skills/
  '';

  meta = {
    description = "AI-driven validation gate for Git pushes";
    homepage = "https://github.com/kunchenguid/no-mistakes";
    license = lib.licenses.mit;
    mainProgram = "no-mistakes";
  };
}
