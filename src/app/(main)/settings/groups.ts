import {BookOpen, Bot, FolderKanban, ListTodo, Network, RadioTower, Settings, Table2} from "lucide-react";
import type {SettingGroup} from "@/types/settings";

/** 기준정보 그룹. 새 기능(서비스)을 추가하면 여기에 그룹을 등록한다 */
export const SETTING_GROUPS: SettingGroup[] = [
    {id: "general", label: "General", icon: Settings, description: "로고 등 전체 공통 설정"},
    {id: "cira", label: "CIRA", icon: FolderKanban, description: "프로젝트·이슈 협업 도구"},
    {id: "mpms", label: "MPMS", icon: Table2, description: "플랫폼·제품 관리"},
    {id: "todo", label: "Tasks", icon: ListTodo, description: "할 일 (Server Actions 실험)"},
    {id: "solace", label: "Solace", icon: RadioTower, description: "Solace 메시징"},
    {id: "interface-test", label: "인터페이스 테스트", icon: Network, description: "REST 메서드별 통신 확인"},
    {id: "study", label: "Study", icon: BookOpen, description: "PDF 학습 뷰어"},
    {id: "ayaan", label: "Ayaan", icon: Bot, description: "AI CLI 작업 전역 정책·Tool·작업공간"},
];

export const DEFAULT_GROUP = "general";
