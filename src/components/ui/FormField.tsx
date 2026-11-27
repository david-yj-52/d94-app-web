import type {ReactNode} from "react";

/**
 * 라벨 + 입력 1개 + 오류 메시지 묶음. <label> 로 감싸서 라벨과 입력이 연결된다(htmlFor 불필요).
 * 오류는 라벨 밖에 둬서 입력의 접근성 이름에 섞이지 않게 한다.
 * 입력이 여러 개(체크박스 묶음·편집기 등)면 쓰지 말고 직접 마크업.
 */
export default function FormField({label, required, error, className, children}: {
    label: ReactNode;
    required?: boolean;
    error?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={className}>
            <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                    {label}{required && <span className="text-red-500"> *</span>}
                </span>
                {children}
            </label>
            {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
        </div>
    );
}
