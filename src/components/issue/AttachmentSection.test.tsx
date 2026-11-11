import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {AttachmentSection} from "./AttachmentSection";

const upload = vi.fn();
vi.mock("@/hooks/useAttachments", () => ({
    useAttachments: () => ({data: [], isLoading: false}),
    useUploadAttachment: () => ({mutate: upload}),
    useDeleteAttachment: () => ({mutate: vi.fn(), isPending: false}),
}));

const file = (name: string, mb: number) =>
    new File([new Uint8Array(mb * 1024 * 1024)], name, {type: "image/png"});

describe("AttachmentSection 5MB 제한", () => {
    it("5MB 초과 파일은 안내 창에 띄우고 올리지 않음, 나머지는 업로드", async () => {
        const {container} = render(<AttachmentSection issueId="i-1"/>);
        const input = container.querySelector('input[type="file"]')!;
        fireEvent.change(input, {target: {files: [file("big.png", 6), file("small.png", 1)]}});

        expect(await screen.findByText("파일 크기 제한")).toBeTruthy();
        expect(screen.getByText("big.png")).toBeTruthy();
        expect(upload).toHaveBeenCalledTimes(1);
        expect(upload.mock.calls[0][0].file.name).toBe("small.png");
    });
});
