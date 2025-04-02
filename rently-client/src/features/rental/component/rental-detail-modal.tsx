"use client";
import type { RentalType } from "@/schemas/rental.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  MapPin,
  Calendar,
  Home,
  Info,
  Map,
  User,
  Clock,
  Mail,
  DollarSign,
  SquareIcon as SquareFootage,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RentalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: RentalType | null;
}

export function RentalDetailModal({
  isOpen,
  onClose,
  rental,
}: RentalDetailModalProps) {
  if (!rental) return null;

  const simpleMapUrl = `https://maps.google.com/maps?q=${rental.lat},${rental.lng}&z=17&output=embed`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-lg">
        {/* Header with gradient background */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-90"></div>
          <DialogHeader className="relative z-10 p-6 text-white">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {rental.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-white/90 mt-1">
              <MapPin className="h-4 w-4" />
              {rental.address}
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="details" className="w-full">
          {/* Tabs navigation with subtle styling */}
          <div className="border-b px-6 sticky top-0 bg-white z-10">
            <TabsList className="flex gap-2 h-14 w-full justify-start bg-transparent">
              <TabsTrigger
                value="details"
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 rounded-md transition-all"
              >
                <Info className="h-4 w-4" />
                <span>Chi tiết</span>
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 rounded-md transition-all"
              >
                <Home className="h-4 w-4" />
                <span>Hình ảnh</span>
              </TabsTrigger>
              <TabsTrigger
                value="map"
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 rounded-md transition-all"
              >
                <Map className="h-4 w-4" />
                <span>Bản đồ</span>
              </TabsTrigger>
              <TabsTrigger
                value="rooms"
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 rounded-md transition-all"
              >
                <Calendar className="h-4 w-4" />
                <span>Phòng</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Details tab with improved layout */}
          <TabsContent
            value="details"
            className="mt-0 p-6 focus-visible:outline-none"
          >
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                <Card className="shadow-sm border-none bg-gray-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-teal-700">
                      <Info className="h-5 w-5" />
                      Thông tin chung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-gray-800">
                        Mô tả
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-white p-4 rounded-lg border border-gray-100">
                        {rental.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-teal-600" />
                          Vị trí
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge
                            variant="outline"
                            className="px-3 py-1 bg-teal-50 text-teal-700 border-teal-200"
                          >
                            Vĩ độ: {rental.lat}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="px-3 py-1 bg-teal-50 text-teal-700 border-teal-200"
                          >
                            Kinh độ: {rental.lng}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-teal-600" />
                          Thời gian
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="flex items-center gap-2">
                            <span className="text-gray-500">Ngày tạo:</span>
                            <span className="font-medium">
                              {rental.createdAt
                                ? format(
                                    new Date(rental.createdAt),
                                    "dd/MM/yyyy"
                                  )
                                : "N/A"}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-gray-500">Cập nhật:</span>
                            <span className="font-medium">
                              {rental.updatedAt
                                ? format(
                                    new Date(rental.updatedAt),
                                    "dd/MM/yyyy"
                                  )
                                : "N/A"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {rental.landlord && (
                      <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <User className="h-4 w-4 text-teal-600" />
                          Thông tin chủ trọ
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">Tên:</span>
                            <span className="font-medium">
                              {rental.landlord.name || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">Email:</span>
                            <span className="font-medium">
                              {rental.landlord.email || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <span className="text-gray-500">ID:</span>
                            <span className="font-medium">
                              {rental.landlordId}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Images tab with improved gallery */}
          <TabsContent
            value="images"
            className="mt-0 p-6 focus-visible:outline-none"
          >
            <ScrollArea className="h-[60vh]">
              {rental.rentalImages && rental.rentalImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rental.rentalImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg overflow-hidden border group hover:shadow-lg transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                      <img
                        src={image.imageUrl || "/placeholder.svg"}
                        alt={`Hình ảnh ${index + 1} của ${rental.title}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute bottom-3 left-3 text-white text-sm font-medium z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        Hình ảnh {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Home className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">Không có hình ảnh</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Map tab with improved styling */}
          <TabsContent
            value="map"
            className="mt-0 p-6 focus-visible:outline-none"
          >
            <div className="h-[60vh] w-full rounded-lg overflow-hidden border shadow-sm">
              <iframe
                src={simpleMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Vị trí của ${rental.title}`}
              ></iframe>
            </div>
          </TabsContent>

          {/* Rooms tab with improved cards */}
          <TabsContent
            value="rooms"
            className="mt-0 p-6 focus-visible:outline-none"
          >
            <ScrollArea className="h-[60vh]">
              {rental.rooms && rental.rooms.length > 0 ? (
                <div className="space-y-4">
                  {rental.rooms.map((room) => {
                    const isAvailable = String(room.isAvailable) === "true";

                    return (
                      <Card
                        key={room.id}
                        className={cn(
                          "shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden",
                          isAvailable
                            ? "border-l-4 border-l-teal-500"
                            : "border-l-4 border-l-rose-500"
                        )}
                      >
                        <CardHeader className="pb-2 bg-gray-50/80">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Home className="h-4 w-4 text-gray-500" />
                              {room.title}
                            </CardTitle>
                            <Badge
                              variant={isAvailable ? "outline" : "destructive"}
                              className={cn(
                                "px-3 py-1 rounded-full",
                                isAvailable
                                  ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                                  : "bg-rose-50 hover:bg-rose-100"
                              )}
                            >
                              {isAvailable ? (
                                <span className="flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Còn trống
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <X className="h-3 w-3" />
                                  Đã thuê
                                </span>
                              )}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <div className="bg-teal-50 p-2 rounded-full">
                                <DollarSign className="h-4 w-4 text-teal-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">
                                  Giá phòng
                                </p>
                                <p className="text-sm font-semibold text-teal-700">
                                  {Number(room.price).toLocaleString()} VNĐ
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="bg-teal-50 p-2 rounded-full">
                                <SquareFootage className="h-4 w-4 text-teal-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">
                                  Diện tích
                                </p>
                                <p className="text-sm font-semibold">
                                  {Number(room.area)} m²
                                </p>
                              </div>
                            </div>
                            <div className="sm:col-span-2 mt-2">
                              <p className="text-xs text-gray-500 font-medium mb-1">
                                Mô tả
                              </p>
                              <p className="text-sm bg-gray-50 p-3 rounded-lg">
                                {room.title || "Không có mô tả"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">Không có thông tin phòng</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
