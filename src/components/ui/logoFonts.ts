import {Black_Han_Sans, Do_Hyeon, Nanum_Gothic, Noto_Sans_KR} from "next/font/google";

// next/font 는 빌드할 때 폰트 파일을 받아 앱에 넣는다 → 실행 중 외부 CDN 호출 없음.
// preload:false — 로고 한 곳에서만 쓰므로 모든 페이지에서 미리 받지 않는다.
const notoSansKr = Noto_Sans_KR({weight: ["700"], subsets: ["latin"], display: "swap", preload: false});
const nanumGothic = Nanum_Gothic({weight: ["700"], subsets: ["latin"], display: "swap", preload: false});
const blackHanSans = Black_Han_Sans({weight: ["400"], subsets: ["latin"], display: "swap", preload: false});
const doHyeon = Do_Hyeon({weight: ["400"], subsets: ["latin"], display: "swap", preload: false});

/** 로고 폰트 목록. id 는 d94-query SettingService.LOGO_FONTS 와 같아야 한다 */
export const LOGO_FONTS: { id: string; label: string; className: string }[] = [
    {id: "default", label: "기본 (시스템)", className: ""},
    {id: "noto-sans-kr", label: "Noto Sans KR", className: notoSansKr.className},
    {id: "nanum-gothic", label: "나눔고딕", className: nanumGothic.className},
    {id: "black-han-sans", label: "Black Han Sans", className: blackHanSans.className},
    {id: "do-hyeon", label: "Do Hyeon", className: doHyeon.className},
];

/** 모르는 id(목록에서 빠진 폰트 등)·없는 값은 기본 폰트 */
export function logoFontClass(id: string | undefined): string {
    return LOGO_FONTS.find((f) => f.id === id)?.className ?? "";
}
