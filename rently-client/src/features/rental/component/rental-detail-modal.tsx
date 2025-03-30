"use client";

import React from "react";
import Image from "next/image";
import { RentalType } from "@/schemas/rental.schema";
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
import { MapPin, Calendar, Home, Info, Map } from "lucide-react";

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {rental.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {rental.address}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">
              <Info className="h-4 w-4 mr-2" />
              Chi tiết
            </TabsTrigger>
            <TabsTrigger value="images">
              <Home className="h-4 w-4 mr-2" />
              Hình ảnh
            </TabsTrigger>
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-2" />
              Bản đồ
            </TabsTrigger>
            <TabsTrigger value="rooms">
              <Calendar className="h-4 w-4 mr-2" />
              Phòng
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <ScrollArea className="h-[60vh] pr-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin chung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Mô tả</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {rental.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Vị trí</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="px-2 py-1">
                          Vĩ độ: {rental.lat}
                        </Badge>
                        <Badge variant="outline" className="px-2 py-1">
                          Kinh độ: {rental.lng}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Thời gian</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          Ngày tạo:{" "}
                          {rental.createdAt
                            ? format(new Date(rental.createdAt), "dd/MM/yyyy")
                            : "N/A"}
                        </p>
                        <p>
                          Cập nhật:{" "}
                          {rental.updatedAt
                            ? format(new Date(rental.updatedAt), "dd/MM/yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {rental.landlord && (
                    <div>
                      <h3 className="font-semibold mb-2">Thông tin chủ trọ</h3>
                      <div className="space-y-1 text-sm">
                        <p>ID: {rental.landlordId}</p>
                        <p>Tên: {rental.landlord.name || "N/A"}</p>
                        <p>Email: {rental.landlord.email || "N/A"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="images" className="mt-4">
            <ScrollArea className="h-[60vh]">
              {rental.rentalImages && rental.rentalImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rental.rentalImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg overflow-hidden border"
                    >
                      {/* Thay vì dùng Image component, sử dụng img tag thông thường để tránh lỗi */}
                      <img
                        src={image.imageUrl}
                        alt={`Hình ảnh ${index + 1} của ${rental.title}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-gray-500">Không có hình ảnh</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <div className="h-[60vh] w-full rounded-lg overflow-hidden border">
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

          <TabsContent value="rooms" className="mt-4">
            <ScrollArea className="h-[60vh]">
              {rental.rooms && rental.rooms.length > 0 ? (
                <div className="space-y-4">
                  {rental.rooms.map((room) => (
                    <Card key={room.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">
                            {room.title}
                          </CardTitle>
                          <Badge>{room.isAvailable}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold">Giá phòng:</p>
                            <p className="text-sm">
                              {room.price.toLocaleString()} VNĐ
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Diện tích:</p>
                            <p className="text-sm">{room.area} m²</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Mô tả:</p>
                            <p className="text-sm">
                              {room.title || "Không có mô tả"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
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
