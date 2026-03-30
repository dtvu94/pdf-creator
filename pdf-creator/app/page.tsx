import type { Metadata } from "next";
import TemplateGallery from "@/components/TemplateGallery";

export const metadata: Metadata = {
  title: "PDF Template Creator",
  description: "WYSIWYG PDF template creator powered by react-pdf",
};

export default function Home() {
  return <TemplateGallery />;
}
