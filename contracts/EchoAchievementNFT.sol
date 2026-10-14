// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
contract EchoAchievementNFT is ERC721Enumerable, ERC721URIStorage, AccessControl {
 bytes32 public constant AWARD_ISSUER_ROLE=keccak256("AWARD_ISSUER_ROLE"); uint256 private _nextTokenId=1;
 struct AwardData{uint256 challengeId;uint8 rank;bytes32 contentHash;address creator;} mapping(uint256=>AwardData) public awards;mapping(bytes32=>bool) public claimed;
 event AwardMinted(uint256 indexed tokenId,uint256 indexed challengeId,uint8 rank,address indexed creator,bytes32 contentHash);
 constructor(address admin) ERC721("ECHO Achievement","ECHO"){require(admin!=address(0),"zero admin");_grantRole(DEFAULT_ADMIN_ROLE,admin);_grantRole(AWARD_ISSUER_ROLE,admin);}
 function mintAward(address creator,uint256 challengeId,uint8 rank,bytes32 contentHash,string calldata uri) external onlyRole(AWARD_ISSUER_ROLE) returns(uint256){require(creator!=address(0)&&challengeId>0&&rank>0&&rank<=3&&contentHash!=bytes32(0)&&bytes(uri).length>0,"invalid award");bytes32 key=keccak256(abi.encode(challengeId,rank));require(!claimed[key],"award claimed");claimed[key]=true;uint256 id=_nextTokenId++;awards[id]=AwardData(challengeId,rank,contentHash,creator);_safeMint(creator,id);_setTokenURI(id,uri);emit AwardMinted(id,challengeId,rank,creator,contentHash);return id;}
 function tokenURI(uint256 id) public view override(ERC721,ERC721URIStorage) returns(string memory){return super.tokenURI(id);}function supportsInterface(bytes4 x) public view override(ERC721Enumerable,ERC721URIStorage,AccessControl) returns(bool){return super.supportsInterface(x);}
 function _update(address to,uint256 tokenId,address auth) internal override(ERC721,ERC721Enumerable) returns(address){return super._update(to,tokenId,auth);}
 function _increaseBalance(address account,uint128 value) internal override(ERC721,ERC721Enumerable){super._increaseBalance(account,value);}
}
