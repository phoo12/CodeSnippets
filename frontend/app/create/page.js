import CreateSnippetForm from "@/components/CreateSnippetForm";
import Link from 'next/link';

// Metadata
export const metadata = {
    title: 'Create New Snippet',
    description: 'Add a new code practice snippet',
};
// Function for Createpage
export default function CreatePage(){
    return (
        <div className="container mx-auto p-4">
        <div className="mb-6 justify-between items-center borderb pb-2">

        <h1 className="text-3xl font-bold">
            Create New Practice Snippet
        </h1>
       
        <Link href="/" className="text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
            &larr; Back to List
        </Link>
      </div>
      <CreateSnippetForm/>
      </div>
      
    )
}