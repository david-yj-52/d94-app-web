// 부록 B (phase1 설계). 2026-11-20부터 ayaan은 MacBook(LaunchAgent com.d94.ayaan)에서 실행, Gateway·ECC는 delAp.
export interface SetupStepGuide {
    step: number;
    title: string;
    why: string;
    todo: string;
    commands: string[];
    check: string;
}

export const SETUP_STEPS: SetupStepGuide[] = [
    {
        "step": 1,
        "title": "AI CLI 로그인",
        "why": "ayaan은 MacBook에서 내 계정으로 CLI를 실행합니다. MacBook 터미널에서 한 번 로그인하면 됩니다(Claude는 Keychain에 저장).",
        "todo": "사용할 Tool마다 MacBook 터미널에서 실행하고 브라우저에서 승인합니다. 그다음 기준정보 > Tool에서 해당 Tool의 `ENABLED`를 켭니다. CLI 버전은 ayaan Dockerfile의 고정 버전에 맞춥니다.",
        "commands": [
            "npm i -g @anthropic-ai/claude-code@2.1.322 @openai/codex@0.167.1 @google/gemini-cli@0.68.0\ncurl https://cursor.com/install -fsS | bash\nclaude login\ncodex login\ngemini\nagent login\n"
        ],
        "check": "CLI 설치 버전(테스트한 버전과 비교), 로그인 여부"
    },
    {
        "step": 2,
        "title": "API 키 (선택)",
        "why": "`AUTH_MODE=API_KEY`로 쓸 Tool만 필요합니다.",
        "todo": "MacBook의 `~/.ayaan/.env`에 `AYAAN_ANTHROPIC_API_KEY=...` 형식으로 추가하고 재기동. 기준정보 > Tool의 `API_KEY_REF`에 변수 이름을, `BUDGET_TOKENS`에 예산을 입력.",
        "commands": [
            "launchctl kickstart -k gui/$(id -u)/com.d94.ayaan\n"
        ],
        "check": "변수 존재 여부(값은 표시하지 않음)"
    },
    {
        "step": 3,
        "title": "작업공간과 git 권한",
        "why": "CLI가 코드를 고치고 커밋·push하려면 MacBook의 작업공간(`~/ayaan-workspace`, 개발용 폴더와 분리)에 저장소와 권한이 있어야 합니다.",
        "todo": "`~/ayaan-workspace` 아래에 clone하고, 매핑 경로도 그 아래로 지정합니다. 배포까지 맡길 저장소만 push 권한을 줍니다. 커밋 작성자는 저장소별로 설정합니다.",
        "commands": [
            "cd ~/ayaan-workspace && git clone <저장소 URL>\ngh auth login && gh auth setup-git\ngit -C <저장소> config user.name \"<이름>\"\ngit -C <저장소> config user.email \"<이메일>\"\n"
        ],
        "check": "작업공간 매핑 경로 존재, `git ls-remote` 성공(여러 저장소를 담은 상위 폴더 매핑은 실패로 표시됨)"
    },
    {
        "step": 4,
        "title": "Telegram (ECC)",
        "why": "중단·재개·완료 알림과 `/run` 명령을 위해 필요합니다.",
        "todo": "Telegram `@BotFather`에서 `/newbot`으로 봇 토큰 발급, `@userinfobot`으로 내 user id 확인 → delAp ECC `.env`의 `ECC_TELEGRAM_BOT_TOKEN`, `ECC_TELEGRAM_ALLOWED_USER_IDS`에 입력 후 재기동. 봇에게 `/start`를 한 번 보냅니다.",
        "commands": [],
        "check": "ECC health, [테스트 알림] 버튼으로 수신 확인"
    },
    {
        "step": 5,
        "title": "Gateway 라우트",
        "why": "웹과 ECC가 delAp Gateway를 거쳐 ayaan을 호출합니다. ayaan이 Eureka에 MacBook IP(`AYAAN_EUREKA_INSTANCE_HOST`, 포트 8086)로 등록되므로 `lb://d94-app-ayaan`이 MacBook으로 갑니다.",
        "todo": "게이트웨이 저장소 설정에 추가 후 재기동(이미 있으면 그대로). MacBook IP는 공유기에서 고정 할당하고, macOS 로컬 네트워크 권한에서 Python을 허용합니다.",
        "commands": [
            "jwt:\n  skip-path-prefixes: /tsh/,/pdf/,/ecc/   # ECC 는 X-ECC-Token 으로 직접 인증\nspring:\n  cloud:\n    gateway:\n      routes:\n        - id: d94-app-ayaan          # 기존 /tsh/** 라우트보다 위에 둔다\n          uri: lb://d94-app-ayaan\n          order: -1\n          predicates: [Path=/tsh/api/v1/ayaan/**]\n        - id: d94-ecc\n          uri: lb://d94-ecc\n          predicates: [Path=/ecc/**]\n          filters: [StripPrefix=1]\n"
        ],
        "check": "Gateway를 거친 ayaan·ECC health"
    },
    {
        "step": 6,
        "title": "기준정보",
        "why": "어떤 Tool로 어느 저장소에서 작업할지 정해야 실행할 수 있습니다.",
        "todo": "기준정보 > 작업공간에 매핑 1건 이상 등록, Tool 탭에서 사용할 Tool 확인, 필요하면 전역 정책 조정(설명 카드 참고).",
        "commands": [],
        "check": "`ENABLED` Tool 1개 이상, 작업공간 매핑 1건 이상, 매핑의 `DEFAULT_TOOL`이 활성 상태"
    }
];
