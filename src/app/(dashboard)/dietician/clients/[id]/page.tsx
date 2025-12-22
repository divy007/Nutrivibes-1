export default function ClientDetailsPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Client Details</h1>
            <p>Details for client ID: {params.id}</p>
        </div>
    );
}
