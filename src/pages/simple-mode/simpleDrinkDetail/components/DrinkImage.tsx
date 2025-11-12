import { Info } from "lucide-react";

interface DrinkImageProps {
	image?: string;
	name: string;
}

const DrinkImage = ({ image, name }: DrinkImageProps) => {
	return (
		<figure className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm sm:shadow-lg bg-base-200">
			{image ? (
				<img
					src={image}
					alt={name}
					className="w-full h-full object-cover"
					loading="lazy"
				/>
			) : (
				<div className="w-full h-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
					<div className="text-center p-4">
						<Info className="w-10 h-10 sm:w-12 sm:h-12 text-base-content/40 mx-auto mb-2" />
						<span className="text-base-content/60 font-medium text-sm sm:text-base">
							No image available
						</span>
					</div>
				</div>
			)}
		</figure>
	);
};

export default DrinkImage;
