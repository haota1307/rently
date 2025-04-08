import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CustomPagination({
  page,
  totalPages,
  onPageChange,
}: CustomPaginationProps) {
  // Hàm tạo mảng các số trang cần hiển thị
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    // Nếu tổng số trang nhỏ, hiển thị tất cả
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }

    // Luôn hiển thị trang đầu tiên
    pageNumbers.push(1);

    // Tính toán vị trí bắt đầu và kết thúc để hiển thị trang hiện tại ở giữa
    let startPage = Math.max(2, page - 1);
    let endPage = Math.min(totalPages - 1, page + 1);

    // Đảm bảo hiển thị đủ số trang
    if (endPage - startPage < 2) {
      if (startPage === 2) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
    }

    // Thêm "..." nếu không bắt đầu từ trang 2
    if (startPage > 2) {
      pageNumbers.push("...");
    }

    // Thêm các trang ở giữa
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Thêm "..." nếu không kết thúc ở trang totalPages - 1
    if (endPage < totalPages - 1) {
      pageNumbers.push("...");
    }

    // Luôn hiển thị trang cuối cùng
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious onClick={() => onPageChange(page - 1)} />
          </PaginationItem>
        )}

        {pageNumbers.map((pageNumber, index) => {
          // Nếu là "..." thì hiển thị dạng text
          if (pageNumber === "...") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <span className="flex h-9 w-9 items-center justify-center">
                  ...
                </span>
              </PaginationItem>
            );
          }

          // Nếu là số trang thì hiển thị button
          return (
            <PaginationItem key={`page-${pageNumber}`}>
              <PaginationLink
                isActive={page === pageNumber}
                onClick={() => onPageChange(pageNumber as number)}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {page < totalPages && (
          <PaginationItem>
            <PaginationNext onClick={() => onPageChange(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
