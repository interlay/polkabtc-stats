import { CumulativeDatapoint } from "./cumulativeDatapoint";

export function getIssues(blockHeight: number): CumulativeDatapoint {
    return {
        blockHeight: blockHeight,
        cumulativeTotal: blockHeight + 1,
    };
}
