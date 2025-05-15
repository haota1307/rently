"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserCircle, Loader2 } from "lucide-react";
import userApiRequest from "@/features/user/user.api";
import { useConversation } from "@/features/conversation/use-conversation";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/use-auth";

type User = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
};

interface SearchUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchUserModal({ open, onOpenChange }: SearchUserModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [initialMessage, setInitialMessage] = useState("");
  const { startConversation, loading: createLoading } = useConversation();
  const { userId } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input khi modal mở
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Tìm kiếm người dùng khi query thay đổi
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        // Gọi API với tham số excludeUserId
        const response = await userApiRequest.searchUsers(
          debouncedQuery,
          userId
        );
        setUsers(response.payload.data || []);
      } catch (error) {
        console.error("Lỗi khi tìm kiếm người dùng:", error);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedQuery]);

  // Xử lý khi chọn người dùng
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  // Xử lý khi tạo cuộc trò chuyện mới
  const handleCreateConversation = async () => {
    if (!selectedUser) return;

    try {
      await startConversation(selectedUser.id, initialMessage);
      setSearchQuery("");
      setSelectedUser(null);
      setInitialMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi khi tạo cuộc trò chuyện:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo cuộc trò chuyện mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Nhập tên hoặc email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Kết quả tìm kiếm */}
          <ScrollArea className="flex-1 max-h-[300px]">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-1">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                      selectedUser?.id === user.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        <UserCircle className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : debouncedQuery && !loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Không tìm thấy người dùng nào</p>
              </div>
            ) : debouncedQuery && debouncedQuery.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nhập ít nhất 2 ký tự để tìm kiếm</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nhập tên hoặc email để tìm kiếm</p>
              </div>
            )}
          </ScrollArea>

          {/* Tin nhắn khởi đầu nếu đã chọn người dùng */}
          {selectedUser && (
            <div className="pt-2 border-t">
              <div className="text-sm font-medium mb-2">
                Nhắn tin cho {selectedUser.name}:
              </div>
              <Input
                placeholder="Nhập tin nhắn đầu tiên (tùy chọn)..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex space-x-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={!selectedUser || createLoading}
          >
            {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bắt đầu trò chuyện
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
