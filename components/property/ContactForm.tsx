"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inquirySchema, type InquiryFormValues } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageSquare, User } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import Image from "next/image";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  agentToken: string;
}

export default function ContactForm({
  propertyId,
  propertyTitle,
  locale,
  agent,
}: {
  propertyId: string;
  propertyTitle: string;
  locale: string;
  agent?: Agent | null;
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
  const displayPhone = agent?.phone ?? COMPANY.phone;
  const displayEmail = agent?.email ?? COMPANY.email;
  const displayPhoto = agent?.photoUrl ?? null;

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
            placeholder="Email *"
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
