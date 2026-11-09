"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Heart,
  MessageSquare,
  Plus,
  Share2,
  Camera,
  UserCheck,
  Send,
  Building,
  Image as ImageIcon,
  Tag,
} from "lucide-react";

import { getProjectPosts, createProjectPost, likeProjectPost, addPostComment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { faDate, toFa } from "@/lib/format";
import type { ProjectPostRow } from "@/lib/types";

interface ProjectPostersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectPostersDialog({ open, onOpenChange }: ProjectPostersDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [isAddPostOpen, setIsAddPostOpen] = React.useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState("");

  // فرم ایجاد پست جدید
  const [newTitle, setNewTitle] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newInstaller, setNewInstaller] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("CABINET");
  const [newPhotoUrl, setNewPhotoUrl] = React.useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["wood-project-posts"],
    queryFn: getProjectPosts,
    enabled: open,
  });

  const likeMut = useMutation({
    mutationFn: (id: string) => likeProjectPost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wood-project-posts"] });
    },
  });

  const commentMut = useMutation({
    mutationFn: ({ postId, text }: { postId: string; text: string }) =>
      addPostComment(postId, { author: "مدیر کارخانه", role: "مدیریت", text }),
    onSuccess: () => {
      toast({ title: "دیدگاه ثبت شد" });
      setCommentText("");
      setActiveCommentPostId(null);
      qc.invalidateQueries({ queryKey: ["wood-project-posts"] });
    },
  });

  const createPostMut = useMutation({
    mutationFn: () => {
      if (!newTitle.trim()) throw new Error("لطفاً عنوان پروژه را وارد کنید.");
      return createProjectPost({
        title: newTitle,
        description: newDesc,
        installerName: newInstaller || "تیم نصب کاردو",
        category: newCategory,
        photos: newPhotoUrl ? [newPhotoUrl] : [],
      });
    },
    onSuccess: () => {
      toast({ title: "پوستر پروژه با موفقیت منتشر گردید" });
      setIsAddPostOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewPhotoUrl("");
      qc.invalidateQueries({ queryKey: ["wood-project-posts"] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "خطا در ثبت پوستر", description: err.message });
    },
  });

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.category === selectedCategory;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full rounded-3xl p-6 select-none max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-start">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Camera className="size-5 text-rose-500" />
              پوستر کاردو (نمایشگاه پروژه‌های نصب‌شده و شبکه اجتماعی کارگاهی)
            </DialogTitle>
            <Button
              size="sm"
              onClick={() => setIsAddPostOpen(true)}
              className="h-8 gap-1.5 text-xs bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-sm"
            >
              <Plus className="size-3.5" />
              اشتراک پوستر جدید
            </Button>
          </div>
          <DialogDescription className="text-xs">
            مشاهده تصاویر واقعی اجرای پروژه‌ها توسط تیم نصب، نظرات کنترل کیفی و تبادل بازخورد سازمانی
          </DialogDescription>
        </DialogHeader>

        {/* فیلتر دسته‌بندی */}
        <div className="flex flex-wrap items-center gap-1.5 border-b pb-3">
          {[
            { key: "ALL", label: "همه پروژه‌ها" },
            { key: "CABINET", label: "کابینت آشپزخانه" },
            { key: "WARDROBE", label: "کمد دیواری" },
            { key: "CLOSET", label: "واک‌این کلوزت" },
            { key: "DECORATION", label: "دکوراسیون اداری و تجاری" },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedCategory === cat.key
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* فرم افزودن پوستر جدید */}
        {isAddPostOpen && (
          <div className="rounded-2xl border bg-rose-500/5 border-rose-500/20 p-4 space-y-3">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-4 text-rose-500" />
              اشتراک‌گذاری عکس و مستندات پروژه تکمیل‌شده
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">عنوان پروژه:</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: کابینت نئوکلاسیک پروژه سعادت‌آباد"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">نام نصاب / سرپرست تیم:</Label>
                <Input
                  value={newInstaller}
                  onChange={(e) => setNewInstaller(e.target.value)}
                  placeholder="مثال: استاد حمید رضایی"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">دسته‌بندی:</Label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-8 w-full rounded-xl border bg-background px-3 text-xs"
                >
                  <option value="CABINET">کابینت آشپزخانه</option>
                  <option value="WARDROBE">کمد دیواری</option>
                  <option value="CLOSET">واک‌این کلوزت</option>
                  <option value="DECORATION">دکوراسیون تجاری</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">لینک یا تصویر پروژه (URL):</Label>
                <Input
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="مثال: /assets/cabinet-sample.jpg"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">توضیحات و مشخصات اجرایی:</Label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="توضیحات در مورد رنگ، یراق‌آلات، رضایت مشتری و چالش‌های نصب..."
                className="h-8 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => setIsAddPostOpen(false)} className="text-xs h-7">
                انصراف
              </Button>
              <Button
                size="sm"
                disabled={createPostMut.isPending}
                onClick={() => createPostMut.mutate()}
                className="text-xs h-7 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {createPostMut.isPending ? "در حال ثبت..." : "انتشار در پوستر"}
              </Button>
            </div>
          </div>
        )}

        {/* لیست پست‌ها */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">در حال بارگذاری نمایشگاه پروژه‌ها...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            هنوز پستی در این دسته‌بندی منتشر نشده است. با دکمه بالا اولین پوستر پروژه را ثبت کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden border border-border shadow-xs flex flex-col justify-between">
                <div>
                  {/* عکس پست */}
                  {post.photos && post.photos.length > 0 ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.photos[0]}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                      <Badge className="absolute top-2 start-2 bg-black/60 text-white backdrop-blur-xs text-[10px]">
                        {post.category === "CABINET"
                          ? "کابینت"
                          : post.category === "WARDROBE"
                          ? "کمد دیواری"
                          : post.category === "CLOSET"
                          ? "کلوزت"
                          : "دکوراسیون"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-muted/40 text-muted-foreground">
                      <ImageIcon className="size-10 opacity-30" />
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-black text-foreground">{post.title}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">{faDate(post.createdAt)}</span>
                    </div>

                    {post.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{post.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <UserCheck className="size-3.5 text-emerald-600" />
                      <span>نصاب: <strong className="text-foreground">{post.installerName || "تیم کاردو"}</strong></span>
                    </div>

                    {/* کامنت‌های موجود */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-3 space-y-1.5 rounded-xl bg-muted/40 p-2.5 text-xs border border-border/60">
                        {post.comments.map((c) => (
                          <div key={c.id} className="text-[11px] leading-relaxed">
                            <strong className="text-primary font-bold">{c.author}:</strong>{" "}
                            <span className="text-foreground">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* فوتر اکشن‌ها */}
                <div className="border-t bg-muted/20 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => likeMut.mutate(post.id)}
                      className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 transition-colors font-semibold"
                    >
                      <Heart className="size-4 fill-rose-500 text-rose-500" />
                      <span>{toFa(post.likesCount)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold"
                    >
                      <MessageSquare className="size-4" />
                      <span>{toFa(post.comments?.length || 0)} نظر</span>
                    </button>
                  </div>

                  {activeCommentPostId === post.id ? (
                    <div className="flex items-center gap-1.5 flex-1 ms-3">
                      <Input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="ثبت نظر کنترل کیفیت..."
                        className="h-7 text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        disabled={!commentText.trim() || commentMut.isPending}
                        onClick={() => commentMut.mutate({ postId: post.id, text: commentText })}
                        className="h-7 px-2 text-xs bg-rose-600 text-white"
                      >
                        <Send className="size-3" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
