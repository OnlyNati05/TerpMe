import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Image
        src="/404/404page.svg"
        alt="404 Page Not Found"
        width={500}
        height={500}
        className="object-contain"
      />
      <h1 className="text-2xl font-semibold mt-2">Page Not Found</h1>
      <p className="text-gray-500">
        The page you're looking for doesn't exist.
      </p>
    </div>
  );
}
