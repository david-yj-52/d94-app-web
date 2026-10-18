import {InterfaceSystemType} from "../constant/types";

export interface HeadVo {
    src: InterfaceSystemType;
    tgt: InterfaceSystemType;
    mid: string;
    enm: string;
    tid: string;
}

export interface CommonBody {
    siteId: string;
    userId: string;
}

export interface UiAgentBodyCommonBody extends CommonBody {
    // static 멤버로 Agent 요청 Method와 URI 설정 필요
}

export interface AgentUiBodyCommonBody extends CommonBody {
    retCode: string; // 기본 값 :OK
    retComment?: string; // 리턴 코멘트
}
