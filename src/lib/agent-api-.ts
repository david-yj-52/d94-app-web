const AGENT_BASE_URL =
    process.env.NEXT_PUBLIC_LOCAL_URL || "http://127.0.0.1:8080";

export const agentApi = {
    async checkStatus() {
        try {
            const response = await fetch(`${AGENT_BASE_URL}/health`, {
                method: "GET",
                mode: "cors",
            });
            return response.ok;
        } catch (error) {
            console.log("Local Agent is not responding: ", error);
            return false;
        }
    },
};
