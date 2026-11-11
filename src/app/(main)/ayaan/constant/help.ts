// 부록 A 원문 (phase1 설계). 키: 전역 11개 + Tool 필드 9개 + 작업공간 필드 4개 = 24. 도움말은 DB가 아니라 코드에 둔다.
export interface HelpEntry {
    label: string;
    tooltip: string;
    what: string;
    defaultRange: string;
    whenToChange: string;
    example: string;
    caution: string;
}

export const CONFIG_HELP: Record<string, HelpEntry> = {
    "EXHAUST_POLICY": {
        "label": "한도 소진 시 동작",
        "tooltip": "작업 중 Tool 한도가 다 떨어졌을 때 기다릴지, 다른 Tool로 넘길지 정합니다.",
        "what": "작업 중 Tool 한도가 다 떨어졌을 때 기다릴지, 다른 Tool로 넘길지 정합니다. 작업 등록 시 따로 지정하면 그 값이 우선합니다.",
        "defaultRange": "`WAIT_SAME_TOOL` / `SWITCH_TOOL`",
        "whenToChange": "빨리 끝내는 것이 맥락 유지보다 중요할 때 `SWITCH_TOOL`.",
        "example": "평소에는 `WAIT_SAME_TOOL`, 급한 이슈만 등록 시 `SWITCH_TOOL` 지정.",
        "caution": "`SWITCH_TOOL`은 새 Tool이 새 세션으로 시작하므로 이전 대화 맥락이 사라지고, 작업공간을 다시 파악하느라 토큰이 더 듭니다."
    },
    "FALLBACK_TOOL_ORDER": {
        "label": "넘길 Tool 순서",
        "tooltip": "`SWITCH_TOOL`일 때 어떤 Tool부터 시도할지 순서입니다.",
        "what": "`SWITCH_TOOL`일 때 어떤 Tool부터 시도할지 순서입니다.",
        "defaultRange": "`CLAUDE,CODEX,GEMINI,CURSOR`. 쉼표 구분, 사용 중(`ENABLED`)인 Tool만 의미 있음.",
        "whenToChange": "특정 Tool의 한도가 넉넉하거나 결과 품질이 좋을 때 앞으로.",
        "example": "`CODEX,CLAUDE`",
        "caution": "여기 없는 Tool로는 넘기지 않습니다."
    },
    "RESUME_CHECK_INTERVAL_SEC": {
        "label": "재개 확인 주기(초)",
        "tooltip": "중단된 작업 중 재개할 수 있는 것이 있는지 확인하는 간격입니다.",
        "what": "중단된 작업 중 재개할 수 있는 것이 있는지 확인하는 간격입니다.",
        "defaultRange": "`60` / 30~3600",
        "whenToChange": "재개가 몇 분 늦어도 괜찮다면 늘려서 d94-query 호출을 줄입니다.",
        "example": "`300`",
        "caution": "이 값만큼 재개가 늦어질 수 있습니다. 모델 호출은 하지 않으므로 한도와는 무관합니다."
    },
    "RESUME_GRACE_SEC": {
        "label": "reset 후 대기(초)",
        "tooltip": "한도 reset 시각이 지나도 이 시간만큼 더 기다렸다가 재개합니다.",
        "what": "한도 reset 시각이 지나도 이 시간만큼 더 기다렸다가 재개합니다. 시계 차이로 너무 일찍 재개해서 다시 막히는 것을 막습니다.",
        "defaultRange": "`120` / 0~1800",
        "whenToChange": "재개 직후 바로 한도 오류가 반복되면 늘립니다.",
        "example": "`300`",
        "caution": "0이면 reset 직후 재개를 시도합니다."
    },
    "MAX_RESUME_COUNT": {
        "label": "재개 횟수 상한",
        "tooltip": "한 작업을 최대 몇 번까지 재개할지입니다.",
        "what": "한 작업을 최대 몇 번까지 재개할지입니다. 넘으면 `FAILED`로 처리하고 알립니다.",
        "defaultRange": "`10` / 1~100",
        "whenToChange": "무료 플랜처럼 한도가 작아 큰 작업이 여러 번 끊기면 늘립니다.",
        "example": "무료 플랜 위주면 `30`",
        "caution": "재개할 때마다 이전 맥락을 다시 읽어 입력 토큰이 듭니다. 너무 크게 두면 끝나지 않는 작업이 한도를 계속 씁니다."
    },
    "TASK_TIMEOUT_SEC": {
        "label": "1회 실행 제한 시간(초)",
        "tooltip": "CLI 한 번 실행이 이 시간을 넘으면 강제 종료하고 `FAILED`(TIMEOUT)로 처리합니다.",
        "what": "CLI 한 번 실행이 이 시간을 넘으면 강제 종료하고 `FAILED`(TIMEOUT)로 처리합니다.",
        "defaultRange": "`1800` / 300~14400",
        "whenToChange": "빌드·테스트가 오래 걸리는 저장소면 늘립니다.",
        "example": "`3600`",
        "caution": "timeout은 자동 재시도하지 않습니다. 수동 재개하면 같은 세션으로 이어서 진행합니다."
    },
    "QUOTA_POLL_INTERVAL_SEC": {
        "label": "한도 수집 주기(초)",
        "tooltip": "Claude usage 조회, Codex 세션 로그 읽기를 하는 간격입니다.",
        "what": "Claude usage 조회, Codex 세션 로그 읽기를 하는 간격입니다.",
        "defaultRange": "`300` / 60~3600",
        "whenToChange": "화면의 한도 값을 더 자주 보고 싶으면 줄이고, 비공식 조회가 막히면 늘립니다.",
        "example": "`600`",
        "caution": "모델을 호출하지 않아 한도를 쓰지 않지만, Claude 비공식 엔드포인트를 너무 자주 부르면 그 조회가 막힐 수 있어 60초 미만은 허용하지 않습니다."
    },
    "CLAUDE_USAGE_POLL": {
        "label": "Claude 비공식 usage 조회",
        "tooltip": "Claude Code가 내부에서 쓰는 사용량 조회 경로로 5시간·주간 사용률과 reset 시각을 가져올지 정합니다.",
        "what": "Claude Code가 내부에서 쓰는 사용량 조회 경로로 5시간·주간 사용률과 reset 시각을 가져올지 정합니다.",
        "defaultRange": "`true` / `true`·`false`",
        "whenToChange": "조회 실패 경고가 계속되거나 비공식 경로 사용을 원하지 않으면 `false`.",
        "example": "`false`",
        "caution": "공식 API가 아니어서 언제든 동작이 바뀔 수 있습니다. 실패하면 자동으로 꺼지고, 이후에는 실행 결과로만 한도를 갱신합니다."
    },
    "REPORT_CRON": {
        "label": "정기 리포트 시각",
        "tooltip": "Tool별 한도와 작업 현황 요약을 Telegram으로 보내는 시각입니다(KST, cron 5필드: 분 시 일 월 요일).",
        "what": "Tool별 한도와 작업 현황 요약을 Telegram으로 보내는 시각입니다(KST, cron 5필드: 분 시 일 월 요일).",
        "defaultRange": "`0 9,18 * * *`(매일 09:00, 18:00)",
        "whenToChange": "받고 싶은 시각·빈도에 맞춰 바꿉니다.",
        "example": "매시 정각 `0 * * * *`, 평일 오전 9시 `0 9 * * 1-5`",
        "caution": "비워 두면 정기 리포트를 보내지 않습니다."
    },
    "NOTIFY_EVENTS": {
        "label": "즉시 알림 이벤트",
        "tooltip": "상태가 바뀔 때 바로 Telegram으로 알릴 이벤트 목록입니다.",
        "what": "상태가 바뀔 때 바로 Telegram으로 알릴 이벤트 목록입니다.",
        "defaultRange": "`PAUSED,RESUMED,DONE,FAILED,QUOTA_EXHAUSTED,QUOTA_RESTORED`",
        "whenToChange": "알림이 너무 많으면 `RESUMED`, `QUOTA_*`를 뺍니다.",
        "example": "`PAUSED,DONE,FAILED`",
        "caution": "`FAILED`는 빼지 않는 것을 권장합니다. 실패한 작업은 수동 재개 전까지 멈춰 있습니다."
    },
    "DEFAULT_PROJECT_KEY": {
        "label": "기본 작업공간",
        "tooltip": "이슈 없이 `/task <프롬프트>`로 실행할 때 사용할 작업공간 매핑의 프로젝트 키입니다.",
        "what": "이슈 없이 `/task <프롬프트>`로 실행할 때 사용할 작업공간 매핑의 프로젝트 키입니다.",
        "defaultRange": "없음 / 작업공간 탭에 등록된 키",
        "whenToChange": "이슈 없는 요청을 주로 보내는 저장소로 지정합니다.",
        "example": "`CIRA`",
        "caution": "비워 두면 `/task`는 거절됩니다."
    },
    "ENABLED": {
        "label": "사용 여부",
        "tooltip": "이 Tool로 작업을 실행할지 정합니다.",
        "what": "이 Tool로 작업을 실행할지 정합니다.",
        "defaultRange": "`CLAUDE`만 `true`, 나머지 `false`",
        "whenToChange": "셋업 1단계에서 로그인을 마친 Tool만 켭니다.",
        "example": "Claude, Codex 켜기",
        "caution": "로그인하지 않은 Tool을 켜면 첫 실행이 `FAILED`가 됩니다. 셋업 화면에서 ✅인지 먼저 확인하세요."
    },
    "AUTH_MODE": {
        "label": "인증 방식",
        "tooltip": "`ACCOUNT`는 CLI에 계정으로 로그인해서 쓰는 방식(무료·유료 플랜 모두), `API_KEY`는 API 키로 과금하는 방식입니다.",
        "what": "`ACCOUNT`는 CLI에 계정으로 로그인해서 쓰는 방식(무료·유료 플랜 모두), `API_KEY`는 API 키로 과금하는 방식입니다.",
        "defaultRange": "`ACCOUNT` / `ACCOUNT`·`API_KEY`",
        "whenToChange": "계정 한도가 부족해서 비용을 내고 API로 계속 돌리고 싶을 때 `API_KEY`.",
        "example": "Claude는 `ACCOUNT`, Gemini는 `API_KEY`",
        "caution": "`API_KEY`는 사용한 만큼 비용이 청구됩니다. `BUDGET_TOKENS`를 꼭 설정하세요."
    },
    "PLAN_NAME": {
        "label": "플랜 이름(표시용)",
        "tooltip": "대시보드에 보일 플랜 이름입니다.",
        "what": "대시보드에 보일 플랜 이름입니다. 동작에는 영향이 없습니다.",
        "defaultRange": "없음 / 자유 입력",
        "whenToChange": "-",
        "example": "`Max 5x`, `Free`, `Plus`",
        "caution": "없음."
    },
    "API_KEY_REF": {
        "label": "API 키 변수 이름",
        "tooltip": "ayaan `.env`에 넣은 API 키의 **변수 이름**입니다.",
        "what": "ayaan `.env`에 넣은 API 키의 **변수 이름**입니다. 키 값은 여기에 입력하지 않습니다.",
        "defaultRange": "없음 / 영문 대문자·숫자·`_`",
        "whenToChange": "`AUTH_MODE=API_KEY`일 때 필수.",
        "example": "`AYAAN_ANTHROPIC_API_KEY`",
        "caution": "키 값을 이 칸에 붙여 넣지 마세요. 셋업 2단계 점검은 변수 존재 여부만 확인합니다."
    },
    "MODEL": {
        "label": "모델",
        "tooltip": "CLI에 지정할 모델 이름입니다.",
        "what": "CLI에 지정할 모델 이름입니다. 비우면 CLI 기본 모델을 씁니다.",
        "defaultRange": "없음 / CLI가 허용하는 모델 이름",
        "whenToChange": "한도를 아끼려고 가벼운 모델을 쓰거나, 어려운 작업에 상위 모델을 쓸 때.",
        "example": "`sonnet`",
        "caution": "플랜에서 쓸 수 없는 모델이면 실행이 실패합니다."
    },
    "MAX_CONCURRENCY": {
        "label": "동시 실행 수",
        "tooltip": "이 Tool로 동시에 실행할 작업 수입니다.",
        "what": "이 Tool로 동시에 실행할 작업 수입니다.",
        "defaultRange": "`1` / 1~4",
        "whenToChange": "상위 플랜처럼 한도가 넉넉하고 작업공간이 여러 개일 때 2 이상.",
        "example": "Claude Max 20x면 `2`",
        "caution": "동시 실행은 한도를 그만큼 빨리 씁니다. 같은 작업공간은 이 값과 관계없이 한 번에 하나만 실행됩니다."
    },
    "FALLBACK_RESET_RULE": {
        "label": "reset 시각 계산 규칙",
        "tooltip": "CLI가 reset 시각을 알려 주지 않을 때 다음 재개 시도 시각을 계산하는 규칙입니다.",
        "what": "CLI가 reset 시각을 알려 주지 않을 때 다음 재개 시도 시각을 계산하는 규칙입니다.",
        "defaultRange": "형식: `DAILY HH:MM <타임존>` / `MONTHLY <일>` / `INTERVAL <숫자>m|h`\n기본값: Claude `INTERVAL 30m`, Codex `INTERVAL 30m`, Gemini `DAILY 00:00 America/Los_Angeles`, Cursor `INTERVAL 60m`",
        "whenToChange": "플랜의 초기화 주기를 알면 그에 맞춥니다. Cursor는 결제일을 넣는 것을 권장합니다.",
        "example": "Cursor 결제일이 15일이면 `MONTHLY 15`, Gemini 무료는 `DAILY 00:00 America/Los_Angeles`",
        "caution": "실제보다 이르게 잡으면 재시도가 늘고, 늦게 잡으면 재개가 늦어집니다. Claude·Codex는 수집한 reset 시각이 우선하고 이 규칙은 보조입니다."
    },
    "BUDGET_TOKENS": {
        "label": "API 예산",
        "tooltip": "`API_KEY` 모드에서 기간당 사용할 최대 토큰(입력+출력)입니다.",
        "what": "`API_KEY` 모드에서 기간당 사용할 최대 토큰(입력+출력)입니다. 넘으면 다음 기간까지 이 Tool을 멈춥니다.",
        "defaultRange": "없음(제한 없음) / 1 이상, 기간 `DAILY`·`MONTHLY`",
        "whenToChange": "`API_KEY` 모드를 켤 때 반드시 설정.",
        "example": "`2000000` / `DAILY`",
        "caution": "ayaan이 실행한 사용량만 계산합니다. 같은 키를 다른 곳에서도 쓰면 실제 청구액은 더 클 수 있습니다."
    },
    "BUDGET_PERIOD": {
        "label": "API 예산",
        "tooltip": "`API_KEY` 모드에서 기간당 사용할 최대 토큰(입력+출력)입니다.",
        "what": "`API_KEY` 모드에서 기간당 사용할 최대 토큰(입력+출력)입니다. 넘으면 다음 기간까지 이 Tool을 멈춥니다.",
        "defaultRange": "없음(제한 없음) / 1 이상, 기간 `DAILY`·`MONTHLY`",
        "whenToChange": "`API_KEY` 모드를 켤 때 반드시 설정.",
        "example": "`2000000` / `DAILY`",
        "caution": "ayaan이 실행한 사용량만 계산합니다. 같은 키를 다른 곳에서도 쓰면 실제 청구액은 더 클 수 있습니다."
    },
    "PROJECT_KEY": {
        "label": "CIRA 프로젝트 키",
        "tooltip": "이슈 키의 앞부분입니다.",
        "what": "이슈 키의 앞부분입니다. `CIRA-12`라면 `CIRA`. 이슈를 등록하면 이 키로 작업공간을 찾습니다.",
        "defaultRange": "필수 / CIRA에 있는 프로젝트 키",
        "whenToChange": "-",
        "example": "`CIRA`, `D94`",
        "caution": "매핑이 없는 프로젝트의 이슈는 등록할 때 거절됩니다."
    },
    "WORKSPACE_PATH": {
        "label": "작업공간 경로",
        "tooltip": "ayaan 컨테이너 안에서 CLI가 작업할 저장소 경로입니다.",
        "what": "ayaan 컨테이너 안에서 CLI가 작업할 저장소 경로입니다.",
        "defaultRange": "필수 / `/workspace` 아래 경로",
        "whenToChange": "저장소를 새로 clone하면 등록합니다.",
        "example": "`/workspace/d94-query`",
        "caution": "호스트의 `WORKSPACE_HOST_PATH` 아래에 미리 clone해 두어야 합니다(셋업 3단계). 두 매핑이 같은 경로를 가리키면 동시에 실행되지 않습니다."
    },
    "DEFAULT_TOOL": {
        "label": "기본 Tool",
        "tooltip": "이 작업공간의 이슈를 등록할 때 Tool을 지정하지 않으면 쓸 Tool입니다.",
        "what": "이 작업공간의 이슈를 등록할 때 Tool을 지정하지 않으면 쓸 Tool입니다.",
        "defaultRange": "`CLAUDE` / `ENABLED`인 Tool",
        "whenToChange": "-",
        "example": "프런트엔드 저장소는 `CURSOR`",
        "caution": "비활성 Tool이면 등록 시 거절됩니다."
    },
    "PROMPT_TEMPLATE": {
        "label": "프롬프트 템플릿",
        "tooltip": "이슈 내용을 CLI에 넘길 때 쓰는 문장 틀입니다.",
        "what": "이슈 내용을 CLI에 넘길 때 쓰는 문장 틀입니다. `{issueKey}`, `{title}`, `{content}`를 이슈 값으로 바꿉니다.",
        "defaultRange": "CIRA 이슈 {issueKey}: {title}\n\n{content}\n\n위 이슈를 구현하고 테스트·빌드를 통과시킨 뒤, 저장소 규칙(CLAUDE.md/AGENTS.md)에 따라 커밋·배포까지 진행해.\n완료되면 마지막 줄에 'AYAAN_RESULT: <한 줄 요약>'을 출력해.",
        "whenToChange": "저장소마다 브랜치·PR·배포 방식이 다를 때.",
        "example": "\"main에 직접 push하지 말고 브랜치를 만들어 PR까지만 올려.\"",
        "caution": "`AYAAN_RESULT:` 줄 지시를 지우면 완료 알림에 요약이 비어 있게 됩니다. 배포까지 시킬지는 여기와 셋업 3단계 권한으로 결정됩니다."
    }
};
