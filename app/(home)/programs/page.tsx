import { ProgramsList } from "./_components/ProgramsList";

export default function ProgramsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-white font-bold text-base">정책 둘러보기</h2>
      </div>
      <ProgramsList />
    </div>
  );
}
