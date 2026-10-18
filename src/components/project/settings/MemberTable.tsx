"use client";

import {useRemoveProjectMember, useUpdateProjectMemberRole,} from "@/hooks/useProjectSettings";
import type {ProjectMemberResponse, ProjectRole} from "@/types/member";

interface Props {
    projectId: string;
    members: ProjectMemberResponse[];
    isAdmin: boolean;
    currentUserEmail?: string | null;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

function Avatar({name, avatarUrl}: { name: string; avatarUrl?: string }) {
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className="w-8 h-8 rounded-full object-cover"
            />
        );
    }
    return (
        <div
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center uppercase">
            {name.charAt(0)}
        </div>
    );
}

export default function MemberTable({
                                        projectId,
                                        members,
                                        isAdmin,
                                        currentUserEmail,
                                        onSuccess,
                                        onError,
                                    }: Props) {
    const {mutate: updateRole, isPending: isUpdatingRole} =
        useUpdateProjectMemberRole(projectId);
    const {mutate: removeMember, isPending: isRemoving} =
        useRemoveProjectMember(projectId);

    const handleRoleChange = (userId: string, role: ProjectRole) => {
        updateRole(
            {userId, role},
            {
                onSuccess: () => onSuccess("역할이 변경되었습니다."),
                onError: () => onError("역할 변경에 실패했습니다."),
            },
        );
    };

    const handleRemove = (userId: string, name: string) => {
        if (!confirm(`${name} 멤버를 제거하시겠습니까?`)) return;
        removeMember(userId, {
            onSuccess: () => onSuccess("멤버가 제거되었습니다."),
            onError: () => onError("멤버 제거에 실패했습니다."),
        });
    };

    if (members.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400 text-sm">
                멤버가 없습니다.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 pl-4 text-left font-medium text-slate-500 text-xs w-10"/>
                    <th className="py-3 text-left font-medium text-slate-500 text-xs">
                        이름
                    </th>
                    <th className="py-3 text-left font-medium text-slate-500 text-xs">
                        이메일
                    </th>
                    <th className="py-3 text-left font-medium text-slate-500 text-xs w-32">
                        역할
                    </th>
                    {isAdmin && (
                        <th className="py-3 pr-4 text-right font-medium text-slate-500 text-xs w-16"/>
                    )}
                </tr>
                </thead>
                <tbody>
                {members.map((member) => (
                    <tr
                        key={member.userId}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                        <td className="py-3 pl-4">
                            <Avatar name={member.name} avatarUrl={member.avatarUrl}/>
                        </td>
                        <td className="py-3 font-medium text-slate-800">{member.name}</td>
                        <td className="py-3 text-slate-500">{member.email}</td>
                        <td className="py-3">
                            {isAdmin ? (
                                <select
                                    value={member.role}
                                    disabled={isUpdatingRole || isRemoving}
                                    onChange={(e) =>
                                        handleRoleChange(member.userId, e.target.value as ProjectRole)
                                    }
                                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="MEMBER">Member</option>
                                </select>
                            ) : (
                                <span
                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                        member.role === "ADMIN"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                    {member.role === "ADMIN" ? "Admin" : "Member"}
                  </span>
                            )}
                        </td>
                        {isAdmin && (
                            <td className="py-3 pr-4 text-right">
                                {member.email !== currentUserEmail && (
                                    <button
                                        onClick={() => handleRemove(member.userId, member.name)}
                                        disabled={isRemoving}
                                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-60"
                                    >
                                        제거
                                    </button>
                                )}
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
