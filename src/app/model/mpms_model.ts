import {AgentUiBodyCommonBody, UiAgentBodyCommonBody} from "./common_model";

export interface UI_NEW_PLTF_DEF_REQ extends UiAgentBodyCommonBody {
    pltfNm?: string;
    pltfAlias?: string;
    pltfBaseUrl: string;
}

export interface UI_NEW_PLTF_DEF_REP extends AgentUiBodyCommonBody {
    pltfId: string;
    pltfNm: string;
    pltfAlias: string;
    pltfBaseUrl: string;
}
