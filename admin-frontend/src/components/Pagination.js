import {ChevronLeft, ChevronRight} from 'lucide-react';
import React from 'react';

const Pagination = ({
	                    pagination,
	                    currentPage,
	                    pageSize,
	                    onPageChange,
	                    onPageSizeChange
                    }) => {
	if (!pagination || pagination.totalPages <= 1) {
		return null;
	}

	return (
		<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
			{/* Mobile pagination */}
			<div className="flex-1 flex justify-between sm:hidden">
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={!pagination.hasPrevPage}
					className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Previous
				</button>
				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={!pagination.hasNextPage}
					className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next
				</button>
			</div>

			{/* Desktop pagination */}
			<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
				<div>
					<p className="text-sm text-gray-700">
						Showing{' '}
						<span className="font-medium">
              {((currentPage - 1) * pageSize) + 1}
            </span>{' '}
						to{' '}
						<span className="font-medium">
              {Math.min(currentPage * pageSize, pagination.totalCount)}
            </span>{' '}
						of{' '}
						<span className="font-medium">{pagination.totalCount}</span>{' '}
						results
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<div className="flex items-center space-x-2">
						<label className="text-sm text-gray-700">Show:</label>
						<select
							value={pageSize}
							onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
							className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
						>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>
					</div>
					<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
						<button
							onClick={() => onPageChange(currentPage - 1)}
							disabled={!pagination.hasPrevPage}
							className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<ChevronLeft className="h-5 w-5"/>
						</button>

						{/* Page numbers */}
						{Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
							let pageNum;
							if (pagination.totalPages <= 5) {
								pageNum = i + 1;
							} else if (currentPage <= 3) {
								pageNum = i + 1;
							} else if (currentPage >= pagination.totalPages - 2) {
								pageNum = pagination.totalPages - 4 + i;
							} else {
								pageNum = currentPage - 2 + i;
							}

							return (
								<button
									key={pageNum}
									onClick={() => onPageChange(pageNum)}
									className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
										pageNum === currentPage
											? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
											: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
									}`}
								>
									{pageNum}
								</button>
							);
						})}

						<button
							onClick={() => onPageChange(currentPage + 1)}
							disabled={!pagination.hasNextPage}
							className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<ChevronRight className="h-5 w-5"/>
						</button>
					</nav>
				</div>
			</div>
		</div>
	);
};

export default Pagination;
