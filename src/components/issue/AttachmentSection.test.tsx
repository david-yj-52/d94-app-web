import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {AttachmentSection} from "./AttachmentSection";

const upload = vi.fn();
vi.mock("@/hooks/useAttachments", () => ({
    useAttachments: () => ({data: [], isLoading: false}),
    useUploadAttachment: () => ({mutate: upload}),
    useDeleteAttachment: () => ({mutate: vi.fn(), isPending: false}),
}));

/** 실제로 큰 배열을 만들지 않고 size 만 흉내 */
const file = (name: string, mb: number) =>
    Object.defineProperty(new File(["x"], name, {type: "image/png"}), "size", {value: mb * 1024 * 1024});

describe("AttachmentSection 50MB 제한", () => {
    it("50MB 초과 파일은 안내 창에 띄우고 올리지 않음, 나머지는 업로드", async () => {
        const {container} = render(<AttachmentSection issueId="i-1"/>);
        const input = container.querySelector('input[type="file"]')!;
        fireEvent.change(input, {target: {files: [file("big.png", 51), file("small.png", 1)]}});

        expect(await screen.findByText("파일 크기 제한")).toBeTruthy();
        expect(screen.getByText("big.png")).toBeTruthy();
        expect(upload).toHaveBeenCalledTimes(1);
        expect(upload.mock.calls[0][0].file.name).toBe("small.png");
    });
});
