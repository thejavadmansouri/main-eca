"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Send,
  Users,
  Hash,
  User,
  RefreshCw,
  Search,
  Sparkles,
  Phone,
  Paperclip,
  CheckCheck,
} from "lucide-react";

import {
  getChannelMessages,
  getDirectMessages,
  sendInternalMessage,
  getUsers,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { faTime, faDate, toFa, ROLE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const CHANNELS = [
  { id: "general", name: "عمومی و اعلانات شرکت", desc: "گفتگوی عمومی کلیه پرسنل و شعب" },
  { id: "sales", name: "فروش و بازرگانی", desc: "هماهنگی قیمت‌ها، تخفیف‌ها و مشتریان" },
  { id: "workshop", name: "کارگاه و تولید چوب", desc: "هماهنگی مراحل ساخت، CNC و یراق‌آلات" },
  { id: "warehouse", name: "انبار و تدارکات", desc: "هماهنگی ورود و خروج بار و تحویل رانندگان" },
];

export default function ChatPage() {
  const currentUser = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<"channel" | "direct">("channel");
  const [selectedChannel, setSelectedChannel] = React.useState("general");
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [messageText, setMessageText] = React.useState("");
  const [userSearch, setUserSearch] = React.useState("");

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // فهرست همکاران
  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const otherUsers = (usersQ.data || []).filter((u) => u.id !== currentUser?.id);

  // پیام‌های کانال
  const channelMessagesQ = useQuery({
    queryKey: ["channel-messages", selectedChannel],
    queryFn: () => getChannelMessages(selectedChannel),
    enabled: activeTab === "channel",
    refetchInterval: 4000,
  });

  // پیام‌های مستقیم
  const directMessagesQ = useQuery({
    queryKey: ["direct-messages", selectedUser?.id],
    queryFn: () => getDirectMessages(selectedUser.id),
    enabled: activeTab === "direct" && !!selectedUser?.id,
    refetchInterval: 4000,
  });

  const sendMut = useMutation({
    mutationFn: () =>
      sendInternalMessage({
        content: messageText.trim(),
        channelId: activeTab === "channel" ? selectedChannel : undefined,
        recipientId: activeTab === "direct" ? selectedUser?.id : undefined,
      }),
    onSuccess: () => {
      setMessageText("");
      if (activeTab === "channel") {
        queryClient.invalidateQueries({ queryKey: ["channel-messages", selectedChannel] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["direct-messages", selectedUser?.id] });
      }
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ارسال پیام",
        description: err?.message || "پیام ارسال نشد.",
        variant: "destructive",
      });
    },
  });

  const messages = activeTab === "channel" ? (channelMessagesQ.data || []) : (directMessagesQ.data || []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (messageText.trim() && !sendMut.isPending) {
        sendMut.mutate();
      }
    }
  };

  const filteredUsers = otherUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 select-none h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full">
      <PageHeader
        title="پیام‌رسان سازمانی کاردو"
        description="ارتباط بلادرنگ درون‌سازمانی، کانال‌های تخصصی دپارتمان‌ها و گفتگوی مستقیم پرسنل"
        icon={MessageSquare}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "channel") channelMessagesQ.refetch();
                else directMessagesQ.refetch();
              }}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className="size-3.5" />
              به‌روزرسانی
            </Button>
          </div>
        }
      />

      {/* بستر اصلی چت */}
      <Card className="flex-1 flex overflow-hidden border-border/80 shadow-sm rounded-2xl">
        {/* ستون کناری کانال‌ها و همکاران */}
        <div className="w-72 sm:w-80 border-e border-border/80 bg-muted/20 flex flex-col shrink-0">
          {/* تب‌بار انتخاب کانال یا گفتگوی مستقیم */}
          <div className="p-3 border-b border-border/80 flex items-center gap-1.5 bg-card/60">
            <button
              onClick={() => setActiveTab("channel")}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                activeTab === "channel"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Hash className="size-3.5" />
              کانال‌های تیمی
            </button>
            <button
              onClick={() => {
                setActiveTab("direct");
                if (!selectedUser && otherUsers.length > 0) {
                  setSelectedUser(otherUsers[0]);
                }
              }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                activeTab === "direct"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Users className="size-3.5" />
              گفتگوی مستقیم
            </button>
          </div>

          {activeTab === "channel" ? (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="text-[11px] font-bold text-muted-foreground px-2 py-1">
                کانال‌های فعال کاری:
              </div>
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={cn(
                    "w-full text-right p-2.5 rounded-xl text-xs font-medium transition-all flex items-start gap-2.5",
                    selectedChannel === ch.id
                      ? "bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <div className="size-7 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Hash className="size-3.5 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{ch.name}</span>
                    <span className="text-[10px] text-muted-foreground font-normal truncate">
                      {ch.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-2 border-b border-border/60">
                <div className="relative">
                  <Search className="size-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="جستجوی همکار..."
                    className="h-8 pr-8 text-xs bg-card"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    همکاری یافت نشد.
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={cn(
                        "w-full text-right p-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5",
                        selectedUser?.id === u.id
                          ? "bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <div className="size-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate text-foreground font-semibold">{u.fullName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ناحیه نمایش پیام‌ها و فرم ارسال */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          {/* نوار سربرگ گفتگو */}
          <div className="h-14 border-b border-border/80 px-4 flex items-center justify-between bg-card/60">
            <div className="flex items-center gap-2.5">
              {activeTab === "channel" ? (
                <>
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Hash className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      {CHANNELS.find((c) => c.id === selectedChannel)?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {CHANNELS.find((c) => c.id === selectedChannel)?.desc}
                    </span>
                  </div>
                </>
              ) : selectedUser ? (
                <>
                  <div className="size-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                    {selectedUser.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      گفتگو با {selectedUser.fullName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {ROLE_LABELS[selectedUser.role] || selectedUser.role} • @{selectedUser.username}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">یک همکار را برای گفتگو انتخاب کنید</span>
              )}
            </div>

            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
              متصل به سرور
            </Badge>
          </div>

          {/* جریان پیام‌ها */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <MessageSquare className="size-10 text-muted-foreground/30" />
                <p className="text-xs font-medium">هنوز پیامی در این گفتگو رد و بدل نشده است.</p>
                <p className="text-[11px]">اولین پیام را بنویسید و کلید Enter را فشار دهید.</p>
              </div>
            ) : (
              messages.map((m: any) => {
                const isMe = m.senderId === currentUser?.id;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex flex-col max-w-[75%] sm:max-w-[65%]",
                      isMe ? "ms-auto items-end" : "me-auto items-start",
                    )}
                  >
                    {!isMe && (
                      <span className="text-[11px] font-bold text-foreground mb-1 px-1">
                        {m.sender?.fullName || "همکار"}
                        {m.sender?.employee?.jobTitle && (
                          <span className="text-[10px] text-muted-foreground font-normal ms-1">
                            ({m.sender.employee.jobTitle})
                          </span>
                        )}
                      </span>
                    )}
                    <div
                      className={cn(
                        "p-3 rounded-2xl text-xs leading-relaxed shadow-2xs break-words",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-ee-xs"
                          : "bg-muted text-foreground rounded-es-xs border border-border/60",
                      )}
                    >
                      {m.content}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 px-1">
                      <span>{faTime(m.createdAt)}</span>
                      {isMe && <CheckCheck className="size-3 text-primary" />}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* نوار ورودی و ارسال پیام */}
          <div className="p-3 border-t border-border/80 bg-card/60 flex items-center gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeTab === "channel"
                  ? `ارسال پیام در کانال #${CHANNELS.find((c) => c.id === selectedChannel)?.name}... (Enter برای ارسال)`
                  : `ارسال پیام مستقیم به ${selectedUser?.fullName || "همکار"}...`
              }
              className="flex-1 text-xs h-10 bg-background"
            />
            <Button
              onClick={() => sendMut.mutate()}
              disabled={sendMut.isPending || !messageText.trim()}
              size="sm"
              className="h-10 px-4 bg-primary text-primary-foreground font-bold gap-1.5 shadow-xs"
            >
              <Send className="size-3.5" />
              ارسال
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
