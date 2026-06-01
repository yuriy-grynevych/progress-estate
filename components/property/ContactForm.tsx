"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inquirySchema, type InquiryFormValues } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageSquare, User, Instagram } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import Image from "next/image";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  agentToken: string;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
}

export default function ContactForm({
  propertyId,
  propertyTitle,
  locale,
  agent,
  companyPhone,
  companyEmail,
}: {
  propertyId: string;
  propertyTitle: string;
  locale: string;
  agent?: Agent | null;
  companyPhone?: string;
  companyEmail?: string;
}) {
  const isUk = locale === "uk";
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      message: propertyTitle
        ? `${isUk ? "Мене цікавить:" : "I am interested in:"} ${propertyTitle}`
        : "",
      propertyId: propertyId || undefined,
    },
  });

  const onSubmit = async (data: InquiryFormValues) => {
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        ...(agent ? { referredByUserId: agent.id } : {}),
      }),
    });
    if (res.ok) {
      toast({
        title: isUk ? "Дякуємо!" : "Thank you!",
        description: isUk ? "Ми зв'яжемося з вами." : "We will contact you soon.",
      });
      reset();
    } else {
      toast({ title: isUk ? "Помилка" : "Error", variant: "destructive" });
    }
  };

  // Use agent contact info if available, otherwise company defaults
  const displayName = agent?.name ?? COMPANY.name ?? "Житлова компанія Progress";
  const displayPhone = agent?.phone ?? companyPhone ?? COMPANY.phone;
  const displayEmail = agent?.email ?? companyEmail ?? COMPANY.email;
  const displayPhoto = agent?.photoUrl ?? null;
  const hasSocials = agent && (agent.instagram || agent.tiktok || agent.facebook);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-navy-900 mb-4">
        {isUk ? "Зв'язатися з агентом" : "Contact Agent"}
      </h2>

      {/* Agent card */}
      <div className="flex flex-col items-center text-center mb-5 p-5 bg-gray-50 rounded-xl gap-3">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-md">
          {displayPhoto ? (
            <Image
              src={displayPhoto}
              alt={displayName}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="w-full">
          <p className="font-bold text-navy-900 text-base mb-2">{displayName}</p>
          <div className="space-y-1.5">
            {displayPhone && (
              <a
                href={`tel:${displayPhone}`}
                className="flex items-center justify-center gap-2 text-sm text-gray-700 hover:text-gold-500 transition font-medium"
              >
                <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                {displayPhone}
              </a>
            )}
            <a
              href={`mailto:${displayEmail}`}
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gold-500 transition"
            >
              <Mail className="w-4 h-4 text-gold-400 flex-shrink-0" />
              <span>{displayEmail}</span>
            </a>
          </div>
          {hasSocials && (
            <div className="flex items-center justify-center gap-3 mt-2">
              {agent.instagram && (
                <a href={`https://instagram.com/${agent.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors" title="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {agent.tiktok && (
                <a href={`https://tiktok.com/@${agent.tiktok.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors" title="TikTok">
                  <TikTokIcon className="w-5 h-5" />
                </a>
              )}
              {agent.facebook && (
                <a href={agent.facebook.startsWith("http") ? agent.facebook : `https://facebook.com/${agent.facebook}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="Facebook">
                  <FacebookIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Input
            {...register("name")}
            placeholder={isUk ? "Ваше ім'я *" : "Your name *"}
            className="text-sm"
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="text-sm"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Input
            {...register("phone")}
            type="tel"
            placeholder={isUk ? "Телефон" : "Phone"}
            className="text-sm"
          />
        </div>
        <div>
          <Textarea
            {...register("message")}
            rows={3}
            placeholder={isUk ? "Ваше повідомлення *" : "Your message *"}
            className="text-sm resize-none"
          />
          {errors.message && (
            <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-gold-400 hover:bg-gold-500 disabled:opacity-50 text-navy-900 font-semibold py-3 rounded-lg transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          {isSubmitting
            ? isUk ? "Надсилання..." : "Sending..."
            : isUk ? "Надіслати запит" : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}
